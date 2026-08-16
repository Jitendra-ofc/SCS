const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
} = require("../controllers/authControllers");


// Register
router.post("/register", registerUser);


// Login
router.post("/login", loginUser);


// Forgot password - sends code
router.post("/forgot-password", forgotPassword);


// Reset password - checks code and changes password
router.post("/reset-password", resetPassword);


module.exports = router;