const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: { 
        type: String, 
        required: true, 
        unique: true // Unique SKU thaka bhalo e-commerce er jonno
    },
    category: String,
    gender: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true
    },
    oldprice: {
        type: Number,
        required: true
    },
    oldPrice: Number, // JSON e 'oldprice' chilo, schema-te 'oldPrice' (CamelCase standard)
    image: {
        type: String,
        required: true
    },
    color: String,
    size: [String], // Array of strings: ["40", "42", "44"]
    quantity: {
        type: Number,
        default: 1
    },
    rating: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true // createdAt ebong updatedAt auto handle korbe
});

const Products = mongoose.model("Product", productSchema);

module.exports = Products;