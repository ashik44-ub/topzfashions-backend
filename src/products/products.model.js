const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    sku: { 
        type: String, 
        required: [true, "SKU is required"], 
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: [true, "Category is required"]
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: ['man', 'woman', 'unisex'] // আপনি চাইলে এটি ফিক্সড করে দিতে পারেন
    },
    brand: { 
        type: String,
        required: [true, "Brand is required"],
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: 0
    },
    oldprice: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: [true, "Product image is required"]
    },
    color: {
        type: String,
        default: ""
    },
    size: {
        type: [String], // Array of strings
        default: []
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true 
});

// মডেল তৈরি
const Products = mongoose.model("Product", productSchema);

module.exports = Products;