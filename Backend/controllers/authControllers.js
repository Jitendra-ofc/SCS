const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};


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
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json",
                },

                body: JSON.stringify({
                    sender: {
                        name: "Smart Complaint System",
                        email: process.env.BREVO_SENDER_EMAIL,
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
                data.message || "Failed to send email"
            );
        }

        console.log("BREVO EMAIL SENT SUCCESSFULLY");
        console.log("Response:", data);
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
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful. You can now login.",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
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
// ==========================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};


// ==========================================
// FORGOT PASSWORD
// SEND 6-DIGIT CODE
// ==========================================

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        console.log("=================================");
        console.log("FORGOT PASSWORD REQUEST");
        console.log("Email:", email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found with this email",
            });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Code expires in 10 minutes
        const resetCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Use updateOne to avoid validation problems
        // with old users in the database
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    resetCode: resetCode,
                    resetCodeExpires: resetCodeExpires,
                },
            }
        );

        console.log("Reset code saved successfully");
        console.log("Sending reset email...");

        await sendEmail(
            user.email,
            "Password Reset Code - Smart Complaint System",
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset</h2>

                    <p>Hello ${user.name || "User"},</p>

                    <p>You requested to reset your password.</p>

                    <p>Your 6-digit password reset code is:</p>

                    <h1 style="
                        letter-spacing: 8px;
                        color: #2f5bb7;
                        font-size: 32px;
                    ">
                        ${resetCode}
                    </h1>

                    <p>This code expires in 10 minutes.</p>

                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `
        );

        console.log(
            "FORGOT PASSWORD SUCCESS: Email sent to",
            user.email
        );
        console.log("=================================");

        return res.status(200).json({
            success: true,
            message: "Password reset code sent successfully",
        });

    } catch (error) {

        console.error("=================================");
        console.error("FORGOT PASSWORD ERROR");
        console.error("Message:", error.message);
        console.error("Full Error:", error);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Failed to send password reset code",
        });
    }
};


// ==========================================
// RESET PASSWORD
// CHECK CODE AND CREATE NEW PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            email,
            code,
            newPassword,
        } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, reset code and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check whether reset code exists
        if (!user.resetCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Please request a password reset code first",
            });
        }

        // Check reset code
        if (user.resetCode !== code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset code",
            });
        }

        // Check expiry
        if (
            !user.resetCodeExpires ||
            user.resetCodeExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset code has expired. Please request a new code.",
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        // Update password and remove reset code
        await User.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    password: hashedPassword,
                },

                $unset: {
                    resetCode: "",
                    resetCodeExpires: "",
                },
            }
        );

        console.log(
            "PASSWORD RESET SUCCESS:",
            user.email
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful. Please login with your new password.",
        });

    } catch (error) {

        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Password reset failed",
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
};