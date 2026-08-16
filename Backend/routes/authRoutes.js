const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
} = require("../controllers/authControllers");


// REGISTER USER
router.post("/register", registerUser);


// LOGIN USER
router.post("/login", loginUser);


// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);


// RESET PASSWORD
router.post("/reset-password", resetPassword);


module.exports = router;