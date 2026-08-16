const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


// ==========================================
// EMAIL TRANSPORTER - BREVO
// ==========================================

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});


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
// SEND EMAIL
// ==========================================

const sendEmail = async (to, subject, html) => {
    try {
        console.log("EMAIL: Connecting to Brevo SMTP...");
        console.log("EMAIL: Sending to:", to);

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.BREVO_SMTP_USER,
            to: to,
            subject: subject,
            html: html,
        });

        console.log("EMAIL SENT SUCCESSFULLY");
        console.log("Message ID:", info.messageId);

        return info;

    } catch (error) {
        console.error("=================================");
        console.error("BREVO EMAIL ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Command:", error.command);
        console.error("=================================");

        throw error;
    }
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


        // CHECK IF USER EXISTS
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
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


        // CREATE VERIFICATION CODE
        const verificationCode = generateVerificationCode();


        // CODE EXPIRES AFTER 10 MINUTES
        const verificationCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        // CREATE USER
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "user",
            isVerified: false,
            verificationCode,
            verificationCodeExpires,
        });


        // SEND VERIFICATION EMAIL
        try {
            await sendEmail(
                user.email,
                "Verify Your Smart Complaint System Account",
                `
                <h2>Email Verification</h2>

                <p>Hello ${user.name},</p>

                <p>Your verification code is:</p>

                <h1>${verificationCode}</h1>

                <p>This code will expire in 10 minutes.</p>

                <p>Please do not share this code with anyone.</p>
                `
            );

        } catch (emailError) {
            console.error(
                "Registration email error:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "User registered but verification email could not be sent",
                error: emailError.message,
            });
        }


        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Verification code sent to your email.",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

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


        // FIND USER
        const user = await User.findOne({
            email: email.toLowerCase(),
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
        console.error("LOGIN ERROR:", error);

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


        if (!email || !enteredCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and verification code are required",
            });
        }


        // FIND USER
        const user = await User.findOne({
            email: email.toLowerCase(),
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
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;

        await user.save();


        return res.status(200).json({
            success: true,
            message:
                "Email verified successfully. You can now login.",
        });

    } catch (error) {
        console.error("VERIFY EMAIL ERROR:", error);

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

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        console.log("Searching for user:", normalizedEmail);

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

        // Generate new 6-digit verification code
        const verificationCode = generateVerificationCode();

        console.log("New verification code generated");

        // Code expires in 10 minutes
        const verificationCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save new verification code
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    verificationCode: verificationCode,
                    verificationCodeExpires: verificationCodeExpires,
                },
            }
        );

        console.log("Verification code saved successfully");

        // ==========================================
        // DEMO MODE
        // Skip Brevo SMTP to avoid connection timeout
        // ==========================================

        console.log("=================================");
        console.log("DEMO VERIFICATION CODE:", verificationCode);
        console.log("Email sending skipped for demo");
        console.log("Code is valid for 10 minutes");
        console.log("=================================");

        return res.status(200).json({
            success: true,
            message: "New verification code generated successfully",
        });

    } catch (error) {

        console.error("=================================");
        console.error("RESEND VERIFICATION ERROR");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Response Code:", error.responseCode);
        console.error("Full Error:", error);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Failed to resend verification code",
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


        const user = await User.findOne({
            email: email.toLowerCase(),
        });


        // SECURITY: DO NOT REVEAL WHETHER EMAIL EXISTS
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If this email exists, a password reset code has been sent.",
            });
        }


        // GENERATE RESET CODE
        const resetCode = generateVerificationCode();


        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );


        await user.save();


        // SEND RESET EMAIL
        await sendEmail(
            user.email,
            "Password Reset Code",
            `
            <h2>Password Reset</h2>

            <p>Hello ${user.name},</p>

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
            error
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


        const enteredCode = resetCode || code;


        if (!email || !enteredCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, reset code and new password are required",
            });
        }


        // FIND USER
        const user = await User.findOne({
            email: email.toLowerCase(),
        });


        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid password reset request",
            });
        }


        // CHECK RESET CODE
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


        // HASH NEW PASSWORD
        user.password = await bcrypt.hash(
            newPassword,
            10
        );


        // CLEAR RESET DATA
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;


        await user.save();


        return res.status(200).json({
            success: true,
            message:
                "Password reset successfully. You can now login.",
        });

    } catch (error) {
        console.error(
            "RESET PASSWORD ERROR:",
            error
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