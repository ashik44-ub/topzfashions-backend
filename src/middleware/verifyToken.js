const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
    try {
        /** * Logic Repair: 
         * Production (Vercel)-এ অনেক সময় ব্রাউজার কুকি পাঠাতে পারে না। 
         * তাই আমরা প্রথমে Cookies এবং তারপর Authorization Header থেকে টোকেন চেক করব।
         */
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send({ 
                success: false,
                message: "লগইন করা নেই! দয়া করে টোকেন প্রদান করুন।" 
            });
        }

        // টোকেন ভেরিফাই করা
        const decoded = jwt.verify(token, jwt_secret);

        if (!decoded.userId) {
            return res.status(403).send({ 
                success: false,
                message: "টোকেনটি সঠিক নয় (User ID missing)" 
            });
        }

        // রিকোয়েস্ট অবজেক্টে ডেটা সেট করা
        req.userId = decoded.userId; 
        req.role = decoded.role;
        
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        
        // টোকেন এক্সপায়ার হয়ে গেলে বা ভুল হলে এই মেসেজ যাবে
        const message = error.name === 'TokenExpiredError' 
            ? "আপনার সেশন শেষ হয়ে গেছে, আবার লগইন করুন।" 
            : "অবৈধ টোকেন!";

        return res.status(401).send({ 
            success: false, 
            message: message 
        });
    }
}

module.exports = verifyToken;