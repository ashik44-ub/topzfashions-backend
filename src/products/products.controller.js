const Reviews = require("../reviews/reviews.model");
const { errorResponse, successResponse } = require("../utils/responseHanlder")
const Products = require("./products.model")
const cloudinary = require('cloudinary').v2;

const createNewProduct = async (req, res) => {
    try {
        // ১. ডিবাগিং: ফ্রন্টএন্ড থেকে আসা ডাটা চেক করা (ঐচ্ছিক)
        // console.log("Incoming Data:", req.body);

        // ২. নতুন প্রোডাক্ট অবজেক্ট তৈরি
        const newProduct = new Products({
            ...req.body,
            // নিশ্চিত করা হচ্ছে যে এগুলো নাম্বার হিসেবেই সেভ হবে
            price: Number(req.body.price),
            oldprice: Number(req.body.oldprice),
            quantity: Number(req.body.quantity || 1),
            rating: 0, // নতুন প্রোডাক্টের শুরুতে কোনো রেটিং থাকবে না
            author: req.body.author // ফ্রন্টএন্ড থেকে আসা ইউজার আইডি
        });

        // ৩. ডাটাবেসে সেভ করা
        const saveProduct = await newProduct.save();

        /* নোট: এখানে Reviews.find করার দরকার নেই। 
           কারণ একটি নতুন তৈরি হওয়া প্রোডাক্টের কোনো রিভিউ ডাটাবেসে আগে থেকে থাকতে পারে না। 
        */

        // ৪. আপনার কাস্টম সাকসেস রেসপন্স পাঠানো
        return successResponse(res, 201, "Product Created Successfully!", saveProduct);

    } catch (error) {
        // ৫. টার্মিনালে এররটি প্রিন্ট করা (ডেভেলপমেন্টের জন্য জরুরি)
        console.error("Mongoose Save Error:", error.message);

        // ৬. এরর মেসেজ হ্যান্ডেল করা
        let errorMessage = "Failed to create new product";
        
        // যদি একই SKU আগে ব্যবহার করা হয়ে থাকে (Unique Key Error)
        if (error.code === 11000) {
            errorMessage = "This SKU already exists! Please use a unique SKU code.";
        } else if (error.name === "ValidationError") {
            errorMessage = `Validation Error: ${error.message}`;
        }

        // আপনার কাস্টম এরর রেসপন্স পাঠানো
        return errorResponse(res, 500, errorMessage, error.message);
    }
}

const getAllProducts = async (req, res) => {
    try {
        const {category, color, minPrice, maxPrice, page=1, limit = 10} = req.query;
        const filter = {};

        // Category Filter
        if (category && category !== 'all') {
            filter.category = category;
        }
        // Color Filter
        if (color && color !== 'all') {
            filter.color = color;
        }

        // Price Filter (MODIFIED LOGIC)
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            // 0 keo value hisebe dhorbe, faka string ba undefined hole skip korbe
            if (minPrice !== "" && minPrice !== undefined) {
                filter.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice !== "" && maxPrice !== undefined) {
                filter.price.$lte = parseFloat(maxPrice);
            }
             // Jodi filter.price empty object {} thake, tobe filter theke remove korbe
             if (Object.keys(filter.price).length === 0) {
                delete filter.price;
             }
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        const products = await Products.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'email username');

        // successResponse-e 'data=' lekhar dorkar nai, shudhu object-ti pathao
        return successResponse(res, 200, "Products fetched successfully", {
            products,
            totalProducts,
            totalPages
        });
    } catch (error) {
        console.error("Backend Error Log:", error); // Terminal e dekho ki error
        return errorResponse(res, 500, "failed to get all products", error.message);
    }
}

const getSignleProduct = async (req, res) => {
    const {id} = req.params;
    try {
        const product = await Products.findById(id).populate('author', 'email username');

        if (!product) {
            return errorResponse(res, 404, "Product not found")
        }
        // product id pabo hocche review model er moddhe theke
        const reviews = await Reviews.find({productId: id}).populate('userId', 'username email')

        return successResponse(res, 200, "Signle product and Reviews", {product, reviews})
    } catch (error) {
        errorResponse(res, 500, "Failed to get single Product")
    }
}

const updateProductByid = async (req, res) => {
    const productId = req.params.id;
    try {
        const updateProduct = await Products.findByIdAndUpdate(productId, {...req.body}, {
            new: true
        })
        if (!updateProduct) {
            return errorResponse(res, 404, "Product not Found")
        }

        return successResponse(res, 200, "Product Updated Succesfull!", updateProduct)

    } catch (error) {
        errorResponse(res, 500, "Failed to update", error)
    }
}

// const deleteProductById = async (req, res) => {
//     const productId = req.params.id;
//     try {
//         const deleteProduct = await Products.findByIdAndDelete(productId);
//         if (!deleteProduct) {
//             return errorResponse(res, 404, "Product not deleted")
//         }
//         await Reviews.deleteMany({productId: productId});
//         return successResponse(res, 200, "Product Deleted Successfully!")
//     } catch (error) {
//         return errorResponse(res, 500, "Failed to Delete Product", error)
//     } 
// }

const deleteProductById = async (req, res) => {
    const productId = req.params.id;
    try {
        // ১. প্রোডাক্টটি আগে খুঁজে বের করুন যাতে ইমেজ URL পাওয়া যায়
        const product = await Products.findById(productId);
        
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }

        // ২. ক্লাউডিনারি থেকে ইমেজ ডিলিট করা
        if (product.image) {
            try {
                // URL থেকে public_id বের করার লজিক
                // এটি URL-এর শেষ অংশ (filename) নেবে এবং এক্সটেনশন (.jpg/.png) বাদ দিবে
                const urlParts = product.image.split('/');
                const fileNameWithExtension = urlParts[urlParts.length - 1]; // "y8n1nppj..."
                const publicId = fileNameWithExtension.split('.')[0]; 

                // ক্লাউডিনারি থেকে ডিলিট
                await cloudinary.uploader.destroy(publicId);
            } catch (imgError) {
                console.error("Cloudinary Delete Error:", imgError);
                // ইমেজের কারণে মেইন ডিলিট প্রসেস যেন না থামে
            }
        }

        // ৩. ডাটাবেস থেকে প্রোডাক্ট এবং রিভিউ ডিলিট
        await Products.findByIdAndDelete(productId);
        await Reviews.deleteMany({ productId: productId });

        return successResponse(res, 200, "Product and Cloudinary image deleted successfully!");

    } catch (error) {
        return errorResponse(res, 500, "Failed to Delete Product", error);
    } 
};

module.exports = {
    createNewProduct,
    getAllProducts,
    getSignleProduct,
    updateProductByid,
    deleteProductById
}