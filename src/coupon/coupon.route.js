const express = require('express');
const { createCoupon, applyCoupon, couponCode, allcoupon, deleteCoupon } = require('./coupon.controller');
const router = express.Router();

router.post("/create-coupon", createCoupon); // এডমিনের জন্য
router.post("/apply-coupon", applyCoupon);   // ইউজারের জন্য
router.get('/:code', couponCode);
router.get('/', allcoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;