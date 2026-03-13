const Products = require("../products/products.model");
const { errorResponse, successResponse } = require("../utils/responseHanlder");
const Reviews = require("./reviews.model");


const postAReview = async(req, res) => {
    try {
        const {comment, rating, userId, productId}= req.body;
        if (!comment || rating === undefined || !productId || !userId) {
            return errorResponse(res, 400, "Missing Required Fields");
        }
        let review = await Reviews.findOne({productId, userId});
        if (review) {
            review.comment = comment;
            review.rating = rating;
            await review.save();
        }else {
            review = new Reviews({comment, rating, userId, productId});
            await review.save();
        }

        const reviews = await Reviews.find({productId});

        const totalRating = reviews.reduce((acc, r)=> acc + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        const product = await Products.findById(productId);
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }
        product.rating = averageRating;
        await product.save({validateBeforeSave: false});

        return successResponse(res, 200, "Reviews Proccessed Successfull", {
            review,
            averageRating : averageRating.toFixed(1)
        });

    } catch (error) {
        errorResponse(res, 500, "Failed to post a Review", error)
    }
}

const getTotalReviewsCount = async(req, res) => {
    const {userId} = req.params;

    try {
        if (!userId) {
            return errorResponse(res, 400, "Missing User ID")
        }
        const reviews = await Reviews.find({userId: userId}).sort({createdAt: -1})
        if (reviews.length === 0) {
             return errorResponse(res, 404, "No Reviews found for this user")
        }

        return successResponse(res, 200, "Reviews Fetched successfully", reviews)
    } catch (error) {
         return errorResponse(res, 500, "Failed to get users Review", error)
    }
}

const getuserReview = async (req, res) => {
    try {
        const { userId } = req.params; // Front-end theke userId pathachcho

        // Shudhu oi nirdishto user-er review gulo khunje ber koro
        const reviews = await Reviews.find({ userId: userId }).sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) {
            return successResponse(res, 200, "No reviews found for this user", []);
        }

        return successResponse(res, 200, "User Reviews Fetched Successfully", reviews);
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        return errorResponse(res, 500, "Failed to get user reviews", error);
    }
}

module.exports = {
    postAReview,
    getTotalReviewsCount,
    getuserReview
}