const User = require("../models/User");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ===============================
// EMAIL TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
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
                message: "Invalid Email"
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
            fullName,
            email: normalizedEmail,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires: new Date(
                Date.now() + 10 * 60 * 1000
            )
        });

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
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
            console.error("EMAIL ERROR:", emailError);

            // User is created, so remove them if email sending fails
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
        console.log("REGISTER ERROR:", error);

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
        console.log("VERIFY EMAIL ERROR:", error);

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

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Your New Verification Code",
            html: `
                <h2>Email Verification</h2>

                <p>Your new verification code is:</p>

                <h1 style="letter-spacing: 5px;">
                    ${verificationCode}
                </h1>

                <p>This code expires in 10 minutes.</p>
            `
        });

        res.status(200).json({
            message: "Verification code sent successfully"
        });

    } catch (error) {
        console.log("RESEND VERIFICATION ERROR:", error);

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
                message: "Invalid Password"
            });
        }

        // Block unverified users
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
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log("LOGIN ERROR:", error);

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

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
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

        res.status(200).json({
            message: "Password reset code sent to your email"
        });

    } catch (error) {
        console.log("FORGOT PASSWORD ERROR:", error);

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
        console.log("RESET PASSWORD ERROR:", error);

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