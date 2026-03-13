const jwt = require('jsonwebtoken');
const { errorResponse, successResponse } = require('../utils/responseHanlder');
const jwt_secret = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
    try {
        // 1. Optional Chaining (?.) use koro jate cookies na thakle crash na kore
        const token = req.cookies?.token;

        if (!token) {
            // Token na thakle 401 (Unauthorized) status dewa uchit
            return res.status(401).send({ message: "Token not found! Please login." });
        }

        const decoded = jwt.verify(token, jwt_secret);

        if (!decoded.userId) {
            return res.status(403).send({ message: "User ID not found in token" });
        }

        // 2. Logic Fix: decoded object theke userId-ti assign koro
        req.userId = decoded.userId; 
        req.role = decoded.role;
        
        next();
    } catch (error) {
        // Token expired ba tampered hole catch block-e asbe
        console.error("JWT Error:", error.message);
        return res.status(401).send({ message: "Invalid or Expired Token!" });
    }
}

module.exports = verifyToken;