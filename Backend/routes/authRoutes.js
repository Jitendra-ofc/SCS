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

// ===============================
// REGISTER
// ===============================
router.post("/register", registerUser);

// ===============================
// LOGIN
// ===============================
router.post("/login", loginUser);

// ===============================
// EMAIL VERIFICATION
// ===============================
router.post("/verify-email", verifyEmail);

router.post(
    "/resend-verification",
    resendVerificationCode
);

// ===============================
// FORGOT PASSWORD
// ===============================
router.post("/forgot-password", forgotPassword);

// ===============================
// RESET PASSWORD
// ===============================
router.post("/reset-password", resetPassword);

module.exports = router;