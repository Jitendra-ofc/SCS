const jwt = require("jsonwebtoken");

// ===============================
// PROTECT ROUTES
// ===============================
const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        // Get token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Add logged-in user to request
        req.user = {
            id: decoded.id,
            fullName: decoded.fullName,
            email: decoded.email,
            role: decoded.role
        };

        // Temporary debugging
        console.log("AUTH USER:", req.user);

        next();

    } catch (error) {
        console.log("AUTH ERROR:", error);

        return res.status(401).json({
            message: "Invalid Token"
        });
    }
};


// ===============================
// EXPORT
// ===============================
module.exports = protect;