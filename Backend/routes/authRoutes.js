const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword
} = require("../controllers/authControllers");


// ==========================================
// REGISTER USER
// ==========================================
router.post("/register", registerUser);


// ==========================================
// LOGIN USER
// ==========================================
router.post("/login", loginUser);


// ==========================================
// VERIFY EMAIL
// ==========================================
router.post("/verify-email", verifyEmail);


// ==========================================
// RESEND VERIFICATION CODE
// ==========================================
router.post("/resend-verification", resendVerificationCode);


// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post("/forgot-password", forgotPassword);


// ==========================================
// RESET PASSWORD
// ==========================================
router.post("/reset-password", resetPassword);


module.exports = router;