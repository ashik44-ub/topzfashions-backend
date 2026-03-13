const express = require('express');
const { errorResponse, successResponse } = require('../utils/responseHanlder');
const User = require('../users/user.model');
const Order = require('../order/Order');
const Reviews = require('../reviews/reviews.model');
const Products = require('../products/products.model');
const router = express.Router();

// 1. Added leading slash '/'
router.get('/user-stats/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return errorResponse(res, 400, "Email is Required");
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return errorResponse(res, 404, "User not Found");
        }

        // Total payments calculation
        const totalPaymentsResult = await Order.aggregate([
            { $match: { email: email } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
        ]);

        const totalPaymentAmount = totalPaymentsResult.length > 0 ? totalPaymentsResult[0].totalAmount : 0;

        // Total Reviews
        const totalReviews = await Reviews.countDocuments({ userId: user._id });

        // 2. Added 'await' and filter {email} for current user only
        const purchaseProducts = await Order.distinct("products.productId", { email: email });
        const totalpurchaseProducts = purchaseProducts.length;

        return successResponse(res, 200, "Fetched User Stats Successfully", {
            totalPayments: Number(totalPaymentAmount.toFixed(2)),
            totalReviews,
            totalpurchaseProducts
        });

    } catch (error) {
        console.error("Stats Error:", error); // Debugging er jonno
        return errorResponse(res, 500, "User Stats Couldn't be retrieved");
    }
});

// admint stats
router.get("/admin-stats", async(req, res)=> {
    try {
        // count total orders
        const totalOrders = await Order.countDocuments();

        // count total products
        const totalproducts = await Products.countDocuments();

        // count total reviews
        const totalReviews = await Reviews.countDocuments();

        // count total users
        const totalUsers = await User.countDocuments();

        // calculate total earnings by summing the amount of all orders
        const totalEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarings: {$sum: "$amount"}
                }
            }
        ]);

        const totalEarings = totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarings : 0 ;

        // calculate monthly earings by summing the amount of all orders grouped by admin
        const monthlyEaringsResult = await Order.aggregate([
            {
                $group: {
                    _id: { month: {$month: "$createdAt"}, year: {$year: "$createdAt"}},
                    monthlyEarnings: {$sum: "$sum"}
                }
            }
        ]);

        // format the monthly earings data for easier consumption on the frontend
        const monthlyEarnings = monthlyEaringsResult.map(entry => ({
            month: entry._id.month,
            year: entry._id.year,
            earnings: entry.monthlyEarnings
        }));

        // send the aggredated data
        res.status(200).json({
            totalOrders,
            totalproducts,
            totalReviews,
            totalUsers,
            totalEarings,
            monthlyEarnings
        })
    } catch (error) {
        return errorResponse(res, 500, "couldn't get admin stats")
    }
})

module.exports = router;