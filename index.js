const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
// sslcommerz
const SSLCommerzPayment = require('sslcommerz-lts')
const { ObjectId } = mongoose.Types;
const User = require('./src/users/user.model.js');

const port = process.env.PORT || 5000;

// 1. Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'https://topzfashons.vercel.app'], // Removed trailing slash for better CORS support
    credentials: true
}));

const UploadImage = require('./src/utils/UploadImage.js')
// 2. Routes (Verify this folder path in your sidebar!)
const userRoutes = require("./src/users/user.routes.js");
const productsRoutes = require("./src/products/products.routes.js")
const reviewsRoutes = require('./src/reviews/reviews.routes.js');
const Order = require('./src/order/Order.js');
const statsRoutes = require('./src/starts/stats.route.js');
const Products = require('./src/products/products.model.js');
const CouponCode = require('./src/coupon/coupon.route.js')
const newsletterRoutes = require('./src/newsletter/newLetter.route.js');
const timer = require('./src/bestdeals/bestdeals.route.js')

app.use('/api/auth', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/reviews', reviewsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/couponcode', CouponCode)
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/bestdeals', timer)



app.get('/', (req, res) => {
    res.send('hello home page');
});

// sslcommerz
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false //true for live, false for sandbox


app.post('/order', async (req, res) => {
    try {
        // ১. রিকুয়েস্ট বডি থেকে discount রিসিভ করুন
        const { products, userId, username, email, amount, discount, shippingInfo } = req.body;
        
        const trans_id = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        const formattedProducts = products.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size
        }));

        // ২. ডাটাবেজে অর্ডার সেভ করার সময় discount ফিল্ডটি যোগ করুন
        const finalOrder = new Order({
            products: formattedProducts, 
            userId,
            username,
            email,
            amount,     // এটি হবে ডিসকাউন্ট বাদে ফাইনাল টাকা (যেমন: ২৩৫০)
            discount: discount || 0, // ৩. এখানে discount ফিল্ডটি যোগ করা হলো
            shippingInfo,
            paidStatus: false,
            transactionId: trans_id,
            status: "pending"
        });

        await finalOrder.save(); 

        // SSLCommerz এর জন্য ডাটা অবজেক্ট
        const data = {
            total_amount: amount, // এখানেও amount (২৩৫০) যাচ্ছে
            currency: 'BDT',
            tran_id: trans_id,
            success_url: `http://localhost:5000/payment/success/${trans_id}`,
            fail_url: `http://localhost:5000/payment/fail/${trans_id}`,
            cancel_url: 'http://localhost:5000/cancel',
            ipn_url: 'http://localhost:5000/ipn',
            shipping_method: 'Courier',
            product_name: products.map(p => p.name).join(', '),
            product_category: 'Ecommerce',
            product_profile: 'general',
            cus_name: username,
            cus_email: email,
            cus_add1: shippingInfo?.address || 'Dhaka',
            cus_city: shippingInfo?.district || 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: shippingInfo?.phone || '01711111111',
            ship_name: username,
            ship_add1: shippingInfo?.address || 'Dhaka',
            ship_city: shippingInfo?.district || 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        
        sslcz.init(data).then(apiResponse => {
            let GatewayPageURL = apiResponse.GatewayPageURL;
            if (GatewayPageURL) {
                res.send({ url: GatewayPageURL });
            } else {
                console.error("SSL Error:", apiResponse);
                res.status(400).send({ message: "SSLCommerz init failed" });
            }
        });

    } catch (error) {
        console.error("Order error stack:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


// ২. সব অর্ডার দেখার জন্য আলাদা রাউট (GET /order) - এইটা আলাদাভাবে নিচে লিখো
app.get('/order', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).send({ data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send({ message: "Failed to fetch orders" });
    }
});


app.post('/payment/success/:tranId', async (req, res) => {
    try {
        const { tranId } = req.params;

        // ১. ট্রানজেকশন আইডি দিয়ে অর্ডার খুঁজে বের করা
        const order = await Order.findOne({ transactionId: tranId });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        // ২. ডাবল আপডেট প্রোটেকশন
        if (order.paidStatus === true) {
            return res.redirect(`https://topzfashons.vercel.app/payment/success/${tranId}`);
        }

        // ৩. স্টক আপডেট লজিক
        for (const item of order.products) {
            const updatedProduct = await Products.findByIdAndUpdate(
                item.productId,
                { $inc: { quantity: -Number(item.quantity) } }, 
                { new: true }
            );

            // স্টক যদি ০ বা তার কম হয় তবে 'Out of Stock' স্ট্যাটাস আপডেট
            if (updatedProduct && updatedProduct.quantity <= 0) {
                await Products.findByIdAndUpdate(item.productId, { 
                    stock: "Out of Stock", 
                    quantity: 0 
                });
            }
        }

        // ৪. পেমেন্ট স্ট্যাটাস এবং অর্ডার স্ট্যাটাস আপডেট
        order.paidStatus = true;
        order.status = "pending"; // আপনি এখানে "pending" চেয়েছিলেন
        await order.save();

        res.redirect(`https://topzfashons.vercel.app/payment/success/${tranId}`);

    } catch (error) {
        console.error("Success route error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// পেমেন্ট ফেইল করলে ডাটা ডিলিট হবে
app.post("/payment/fail/:tranId", async (req, res) => {
    try {
        const { tranId } = req.params;
        await Order.deleteOne({ transactionId: tranId, paidStatus: false });
        res.redirect(`https://topzfashons.vercel.app/payment/fail/${tranId}`);
    } catch (error) {
        res.status(500).send("Error deleting failed order");
    }
});

// ইউজার নিজে ক্যানসেল করলে ডাটা ডিলিট হবে
// ১. পেমেন্ট ক্যানসেল করলে ডেটা ডিলিট করার রাউট
app.post("/payment/cancel/:tranId", async (req, res) => {
    try {
        const { tranId } = req.params;

        // ডেটাবেজ থেকে ওই ট্রানজেকশন আইডির অর্ডারটি খুঁজে ডিলিট করে দিবে
        const deletedOrder = await Order.findOneAndDelete({ 
            transactionId: tranId, 
            paidStatus: false // নিশ্চিত হওয়া যে এটি পেইড অর্ডার নয়
        });

        if (deletedOrder) {
            console.log(`Order ${tranId} deleted because payment was cancelled.`);
        }

        // ইউজারকে আবার কার্ট পেজে পাঠিয়ে দিন
        res.redirect(`https://topzfashons.vercel.app/cart`); 
    } catch (error) {
        console.error("Cancel Route Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// ২. পেমেন্ট ফেইল করলে ডেটা ডিলিট করার রাউট
app.post("/payment/fail/:tranId", async (req, res) => {
    try {
        const { tranId } = req.params;
        await Order.findOneAndDelete({ transactionId: tranId, paidStatus: false });
        
        // ইউজারকে ফেইল পেজে রিডাইরেক্ট করুন
        res.redirect(`https://topzfashons.vercel.app/payment/fail/${tranId}`);
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});


// index.js file-e anyo route-er niche eita add koro
app.get('/order/:email', async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) {
            return res.status(400).send({ message: "Email is required" });
        }
        // Shudhu paid orders gulo dekhano uchit summary-te
        const orders = await Order.find({ email: email }).sort({ createdAt: -1 });
        
        res.status(200).send({ data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Delete Order
app.delete('/order/delete-order/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: "Order deleted" });
    } catch (error) {
        res.status(500).send("Error deleting order");
    }
});

// Update Status
app.patch('/order/update-order-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.status(200).send({ message: "Status updated" });
    } catch (error) {
        res.status(500).send("Error updating status");
    }
});

// index.js এর ভেতর অর্ডারের রাউটটি এমন হওয়া উচিত
app.get('/api/order/order/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log("id found:", id); // ১. প্রথম চেক: আইডি কি ব্যাকএন্ডে আসছে?

        // ২. ডাটাবেস চেক (যদি Mongoose ব্যবহার করেন)
        const order = await Order.findById(id); 
        
        if (!order) {
            console.log("no order in this id।");
            return res.status(404).json({ message: "Order not found" });
        }

        console.log("order data:", order); // ২. দ্বিতীয় চেক: ডাটাবেস থেকে কি ডাটা আসছে?
        res.status(200).json(order);
    } catch (error) {
        console.error("server error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// 3. Database Connection
async function main() {
    try {
        await mongoose.connect(process.env.URL);
        console.log("mongodb connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error); // Fixed 'err' to 'error'
    }
}

main();

// upload image api
app.post('/uploadImage', async(req, res)=> {
    await UploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((error) => res.status(500).send(error));
})

// 4. Start Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});