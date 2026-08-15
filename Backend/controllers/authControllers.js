const User = require("../models/User");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ===============================
// EMAIL TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// ===============================
// GENERATE 6 DIGIT CODE
// ===============================
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


// ===============================
// REGISTER USER
// ===============================
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationCode = generateCode();

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires: new Date(
                Date.now() + 10 * 60 * 1000
            ),
            isVerified: false
        });

        try {
            await transporter.sendMail({
                from: `"Smart Complaint System" <${process.env.EMAIL_USER}>`,
                to: normalizedEmail,
                subject: "Verify Your Smart Complaint System Account",
                html: `
                    <h2>Email Verification</h2>

                    <p>Hello ${fullName},</p>

                    <p>Thank you for registering with Smart Complaint Management System.</p>

                    <p>Your verification code is:</p>

                    <h1 style="letter-spacing: 5px;">
                        ${verificationCode}
                    </h1>

                    <p>This code will expire in 10 minutes.</p>
                `
            });

        } catch (emailError) {
            console.error(
                "REGISTER EMAIL ERROR:",
                emailError.message
            );

            await User.findByIdAndDelete(newUser._id);

            return res.status(500).json({
                message: "Could not send verification email. Please try again."
            });
        }

        res.status(201).json({
            message: "Registration successful. Please check your email for the verification code.",
            email: newUser.email
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ===============================
// VERIFY EMAIL
// ===============================
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                message: "Email and verification code are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        if (
            user.verificationCode !== code ||
            !user.verificationCodeExpires ||
            user.verificationCodeExpires < new Date()
        ) {
            return res.status(400).json({
                message: "Invalid or expired verification code"
            });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;

        await user.save();

        res.status(200).json({
            message: "Email verified successfully. You can now login."
        });

    } catch (error) {
        console.error("VERIFY EMAIL ERROR:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ===============================
// RESEND VERIFICATION CODE
// ===============================
const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        const verificationCode = generateCode();

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        try {
            await transporter.sendMail({
                from: `"Smart Complaint System" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Your New Verification Code",
                html: `
                    <h2>Email Verification</h2>

                    <p>Hello ${user.fullName},</p>

                    <p>Your new verification code is:</p>

                    <h1 style="letter-spacing: 5px;">
                        ${verificationCode}
                    </h1>

                    <p>This code expires in 10 minutes.</p>
                `
            });

        } catch (emailError) {
            console.error(
                "RESEND VERIFICATION ERROR:",
                emailError.message
            );

            return res.status(500).json({
                message: "Could not send verification code"
            });
        }

        res.status(200).json({
            message: "Verification code sent successfully"
        });

    } catch (error) {
        console.error(
            "RESEND VERIFICATION ERROR:",
            error.message
        );

        res.status(500).json({
            message: "Could not send verification code"
        });
    }
};


// ===============================
// LOGIN USER
// ===============================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                needsVerification: true,
                email: user.email
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ===============================
// FORGOT PASSWORD
// ===============================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email"
            });
        }

        const resetCode = generateCode();

        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await user.save();

        try {
            await transporter.sendMail({
                from: `"Smart Complaint System" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Password Reset Code - Smart Complaint System",
                html: `
                    <h2>Password Reset Request</h2>

                    <p>Hello ${user.fullName},</p>

                    <p>Your password reset code is:</p>

                    <h1 style="letter-spacing: 5px;">
                        ${resetCode}
                    </h1>

                    <p>This code will expire in 10 minutes.</p>

                    <p>If you did not request a password reset, please ignore this email.</p>
                `
            });

        } catch (emailError) {
            console.error(
                "FORGOT PASSWORD EMAIL ERROR:",
                emailError.message
            );

            return res.status(500).json({
                message: "Could not send reset code"
            });
        }

        res.status(200).json({
            message: "Password reset code sent to your email"
        });

    } catch (error) {
        console.error(
            "FORGOT PASSWORD ERROR:",
            error.message
        );

        res.status(500).json({
            message: "Could not send reset code"
        });
    }
};


// ===============================
// RESET PASSWORD
// ===============================
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            user.resetPasswordCode !== code ||
            !user.resetPasswordCodeExpires ||
            user.resetPasswordCodeExpires < new Date()
        ) {
            return res.status(400).json({
                message: "Invalid or expired reset code"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpires = null;

        await user.save();

        res.status(200).json({
            message: "Password reset successful. You can now login."
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ===============================
// EXPORTS
// ===============================
module.exports = {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword
};