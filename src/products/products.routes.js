const express = require('express');
const { createNewProduct, getAllProducts, getSignleProduct, updateProductByid, deleteProductById } = require('./products.controller');
const verifyAdmin = require('../middleware/verifyAdmin');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();


// product route only for admin
router.post("/create-product", createNewProduct);

// get all products
router.get('/', getAllProducts);

//get single product
router.get('/:id', getSignleProduct);

// update product by admin
// router.patch('/update-product/:id', verifyAdmin, verifyToken, updateProductByid) wrong serial

router.patch('/update-product/:id', verifyToken, verifyAdmin, updateProductByid);

// delete product
// router.delete('/:id', verifyAdmin, verifyToken, deleteProductById)      wrong serial 
router.delete('/:id', verifyToken, verifyAdmin, deleteProductById);


module.exports = router;