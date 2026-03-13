const jwt = require('jsonwebtoken');

// Secret key jodi na thake tar jonno ekta check rakha bhalo
const jwt_secret = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
    try {
        // 1. Token extract kora (Cookie ba Header theke)
        let token = req.cookies?.token;

        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }
        }

        // 2. Token na thakle 401 return
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized Access! Please login first." 
            });
        }

        // 3. Token verify kora
        jwt.verify(token, jwt_secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid or Expired Token!" 
                });
            }

            // 4. Payload check kora (Security-r jonno userId check kora bhalo)
            if (!decoded || !decoded.userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Forbidden! Invalid token payload." 
                });
            }

            // 5. Request object-e data pass kora
            req.userId = decoded.userId;
            req.role = decoded.role;
            
            next();
        });

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error in authentication." 
        });
    }
};

module.exports = verifyToken;