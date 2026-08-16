const jwt = require("jsonwebtoken");

// ===============================
// PROTECT ROUTES
// ===============================

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId =
            decoded.id ||
            decoded._id ||
            decoded.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid token: User ID is missing"
            });
        }

        req.user = {
            id: userId,
            name:
                decoded.name ||
                decoded.fullName ||
                "",
            fullName:
                decoded.fullName ||
                decoded.name ||
                "",
            email: decoded.email || "",
            role: decoded.role || "user"
        };

        console.log("AUTH USER:", req.user);

        next();

    } catch (error) {
        console.error(
            "AUTH ERROR:",
            error.message
        );

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;