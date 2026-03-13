const express = require('express');
const User = require('./user.model');
const { userRegister, userLoggedIn, userlogout, getAllUsers, deleteUser, updateUserRole, editUserProfile, verifyOTP, resetPassword, forgotPassword, resendOTP } = require('./user.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const router = express.Router();

// I recommend using .post for registration, but keeping .get 
// for now just so you can test it in your browser easily.
router.post('/register', userRegister);

router.post('/verify-otp', verifyOTP);

router.post("/resend-otp", resendOTP);

router.post('/forget-password', forgotPassword)

router.post('/reset-password', resetPassword)

//login route
router.post('/login', userLoggedIn);

// logout route
router.post("/logout", userlogout)

//get all endpoints (token verify and admin for access)
router.get('/users', verifyToken, verifyAdmin, getAllUsers) 

// delete route only for admin
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser)

// user update route
router.put('/user/:id', verifyToken, verifyAdmin, updateUserRole)

// edit user profile
router.patch('/edit-profile/:id', verifyToken, editUserProfile)

module.exports = router;