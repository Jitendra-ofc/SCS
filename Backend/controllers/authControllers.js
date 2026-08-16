const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ==========================================
// SEND EMAIL USING BREVO API
// ==========================================

const sendEmail = async (to, subject, html) => {
    try {
        console.log("=================================");
        console.log("BREVO API: Sending email...");
        console.log("To:", to);

        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                },

                body: JSON.stringify({
                    sender: {
                        name: "Smart Complaint Management System",
                        email: process.env.EMAIL_FROM,
                    },

                    to: [
                        {
                            email: to,
                        },
                    ],

                    subject: subject,
                    htmlContent: html,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("BREVO API ERROR:", data);

            throw new Error(
                data.message || "Brevo failed to send email"
            );
        }

        console.log("BREVO EMAIL SENT SUCCESSFULLY");
        console.log("Message ID:", data.messageId);
        console.log("=================================");

        return data;

    } catch (error) {
        console.error("=================================");
        console.error("EMAIL ERROR:", error.message);
        console.error("=================================");

        throw error;
    }
};


// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};


// ==========================================
// GENERATE 6 DIGIT VERIFICATION CODE
// ==========================================

const generateVerificationCode = () => {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
};


// ==========================================
// REGISTER USER
// POST /api/auth/register
// ==========================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
        } = req.body;


        // VALIDATION
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        // CHECK IF USER EXISTS
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });


        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }


        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // GENERATE VERIFICATION CODE
        const verificationCode = generateVerificationCode();


        const verificationCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // CREATE USER
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "user",
            isVerified: false,
            verificationCode,
            verificationCodeExpires,
        });


        // SEND EMAIL
        await sendEmail(
            user.email,
            "Verify Your Smart Complaint System Account",
            `
            <h2>Email Verification</h2>

            <p>Hello ${user.name || "User"},</p>

            <p>Your verification code is:</p>

            <h1>${verificationCode}</h1>

            <p>This code will expire in 10 minutes.</p>

            <p>Please do not share this code with anyone.</p>
            `
        );


        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Please check your email for the verification code.",
            email: user.email,
        });

    } catch (error) {

        console.error("=================================");
        console.error("REGISTER ERROR:", error.message);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
};


// ==========================================
// LOGIN USER
// POST /api/auth/login
// ==========================================

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;


        // VALIDATION
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        // FIND USER
        const user = await User.findOne({
            email: normalizedEmail,
        });


        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }


        // CHECK PASSWORD
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );


        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }


        // CHECK EMAIL VERIFICATION
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in",
                needsVerification: true,
                email: user.email,
            });
        }


        // GENERATE TOKEN
        const token = generateToken(user._id);


        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};


// ==========================================
// VERIFY EMAIL
// POST /api/auth/verify-email
// ==========================================

const verifyEmail = async (req, res) => {
    try {
        const {
            email,
            verificationCode,
            code,
        } = req.body;


        const enteredCode = verificationCode || code;


        // VALIDATION
        if (!email || !enteredCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and verification code are required",
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        // FIND USER
        const user = await User.findOne({
            email: normalizedEmail,
        });


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }


        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }


        // CHECK CODE
        if (
            user.verificationCode !==
            enteredCode.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }


        // CHECK EXPIRATION
        if (
            user.verificationCodeExpires &&
            user.verificationCodeExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification code has expired. Please request a new code.",
            });
        }


        // VERIFY USER
        // Using updateOne avoids the old MongoDB "name is required" error
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    isVerified: true,
                },

                $unset: {
                    verificationCode: "",
                    verificationCodeExpires: "",
                },
            }
        );


        console.log(
            "EMAIL VERIFIED SUCCESSFULLY:",
            user.email
        );


        return res.status(200).json({
            success: true,
            message:
                "Email verified successfully. You can now login.",
        });

    } catch (error) {

        console.error("=================================");
        console.error("VERIFY EMAIL ERROR:", error.message);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Email verification failed",
            error: error.message,
        });
    }
};


// ==========================================
// RESEND VERIFICATION CODE
// POST /api/auth/resend-verification
// ==========================================

const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;


        console.log("=================================");
        console.log("RESEND REQUEST RECEIVED");
        console.log("Email:", email);


        // VALIDATION
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        console.log(
            "Searching for user:",
            normalizedEmail
        );


        // FIND USER
        const user = await User.findOne({
            email: normalizedEmail,
        });


        if (!user) {
            console.log("RESEND ERROR: User not found");

            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }


        console.log("User found:", user.email);
        console.log("User verified:", user.isVerified);


        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "This email is already verified",
            });
        }


        // GENERATE NEW CODE
        const verificationCode =
            generateVerificationCode();


        console.log(
            "New verification code generated"
        );


        const verificationCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // SAVE CODE WITHOUT VALIDATING OLD USER FIELDS
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    verificationCode: verificationCode,
                    verificationCodeExpires:
                        verificationCodeExpires,
                },
            }
        );


        console.log(
            "Verification code saved successfully"
        );


        // SEND EMAIL THROUGH BREVO API
        console.log(
            "Attempting to send email through Brevo..."
        );


        await sendEmail(
            user.email,
            "Your New Verification Code",
            `
            <h2>Email Verification</h2>

            <p>Hello ${user.name || "User"},</p>

            <p>Your new verification code is:</p>

            <h1>${verificationCode}</h1>

            <p>This code expires in 10 minutes.</p>
            `
        );


        console.log(
            "RESEND SUCCESS: Email sent successfully to",
            user.email
        );

        console.log("=================================");


        return res.status(200).json({
            success: true,
            message:
                "New verification code sent successfully",
        });

    } catch (error) {

        console.error("=================================");
        console.error("RESEND VERIFICATION ERROR");
        console.error("Message:", error.message);
        console.error("Full Error:", error);
        console.error("=================================");


        return res.status(500).json({
            success: false,
            message:
                "Failed to resend verification code",
            error: error.message,
        });
    }
};


// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==========================================

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;


        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        // FIND USER
        const user = await User.findOne({
            email: normalizedEmail,
        });


        // SECURITY
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If this email exists, a password reset code has been sent.",
            });
        }


        // GENERATE RESET CODE
        const resetCode =
            generateVerificationCode();


        const resetPasswordExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // UPDATE ONLY REQUIRED FIELDS
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    resetPasswordCode: resetCode,
                    resetPasswordExpires:
                        resetPasswordExpires,
                },
            }
        );


        // SEND RESET EMAIL
        await sendEmail(
            user.email,
            "Password Reset Code",
            `
            <h2>Password Reset</h2>

            <p>Hello ${user.name || "User"},</p>

            <p>Your password reset code is:</p>

            <h1>${resetCode}</h1>

            <p>This code will expire in 10 minutes.</p>

            <p>If you did not request this, you can ignore this email.</p>
            `
        );


        return res.status(200).json({
            success: true,
            message:
                "Password reset code sent to your email",
        });

    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to send password reset code",
            error: error.message,
        });
    }
};


// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            email,
            resetCode,
            code,
            newPassword,
        } = req.body;


        const enteredCode =
            resetCode || code;


        // VALIDATION
        if (
            !email ||
            !enteredCode ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, reset code and new password are required",
            });
        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // FIND USER
        const user = await User.findOne({
            email: normalizedEmail,
        });


        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid password reset request",
            });
        }


        // CHECK CODE
        if (
            user.resetPasswordCode !==
            enteredCode.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset code",
            });
        }


        // CHECK EXPIRATION
        if (
            user.resetPasswordExpires &&
            user.resetPasswordExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset code has expired. Please request a new one.",
            });
        }


        // HASH PASSWORD
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        // UPDATE WITHOUT MONGOOSE FULL DOCUMENT VALIDATION
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    password: hashedPassword,
                },

                $unset: {
                    resetPasswordCode: "",
                    resetPasswordExpires: "",
                },
            }
        );


        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully. You can now login.",
        });

    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Password reset failed",
            error: error.message,
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
};