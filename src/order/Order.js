// const mongoose = require('mongoose');
// const orderSchema = new mongoose.Schema({
//     products: Array,
//     userId: String,
//     username: String,
//     email: String,
//     amount: Number,
//     paidStatus: { type: Boolean, default: false },
//     transactionId: String,
// }, { timestamps: true });

// // ২. মডেল তৈরি (This is the 'Order' the error is looking for)
// const Order = mongoose.model('Order', orderSchema);

// module.exports = Order;

// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//     userId: { 
//         type: String, 
//         default: null // গেস্ট ইউজার হতে পারে তাই null রাখা হয়েছে
//     },
//     username: { type: String, required: true },
//     email: { type: String, required: true },
//     products: [
//         {
//             productId: String,
//             quantity: Number,
//             size: String
//         }
//     ],
//     amount: { type: Number, required: true },
    
//     // শিপিং ইনফরমেশনের জন্য নতুন অবজেক্ট
//     shippingInfo: {
//         firstName: String,
//         lastName: String,
//         address: String,
//         district: String,
//         phone: String,
//         email: String
//     },

//     paidStatus: { type: Boolean, default: false },
//     transactionId: { type: String },
//     status: { 
//         type: String, 
//         enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//         default: 'pending' 
//     }
// }, { timestamps: true });

// const Order = mongoose.model('Order', orderSchema);

// module.exports = Order;
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        default: null 
    },
    username: { type: String, required: true },
    email: { type: String, required: true },
    products: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            size: { type: String },
            image: { type: String }
        }
    ],
    amount: { type: Number, required: true },   // ডিসকাউন্ট এবং শিপিং সহ ফাইনাল টোটাল
    discount: { type: Number, default: 0 },    // <--- এটি যোগ করুন (কত টাকা ছাড় পেল)
    
    shippingInfo: {
        firstName: String,
        lastName: String,
        address: String,
        district: String,
        phone: String,
        email: String,
        deliveryCharge: Number
    },

    paidStatus: { type: Boolean, default: false },
    transactionId: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending' 
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;