const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===============================
// PROTECT ROUTES
// ===============================
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // CHECK TOKEN EXISTS
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        // GET TOKEN
        const token = authHeader.split(" ")[1];

        // VERIFY TOKEN
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("DECODED TOKEN:", decoded);

        // GET USER FROM DATABASE
        const user = await User.findById(decoded.id).select(
            "-password"
        );

        // CHECK USER EXISTS
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // ADD USER TO REQUEST
        req.user = {
            id: user._id.toString(),
            name: user.name || "",
            fullName: user.name || "",
            email: user.email || "",
            role: user.role || "user"
        };

        console.log("AUTH USER:", req.user);

        next();

    } catch (error) {

        console.error(
            "AUTH ERROR:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;