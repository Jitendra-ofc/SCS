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
            fullName: user.fullName,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
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
                    "content-type": "application/json",
                    "api-key": process.env.BREVO_API_KEY
                },

                body: JSON.stringify({
                    sender: {
                        name: "Smart Complaint Management System",
                        email:
                            process.env.BREVO_SENDER_EMAIL ||
                            process.env.EMAIL_FROM
                    },

                    to: [
                        {
                            email: to
                        }
                    ],

                    subject: subject,

                    htmlContent: html
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("BREVO API ERROR:", data);

            throw new Error(
                data.message ||
                "Failed to send email"
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
// GENERATE 6 DIGIT CODE
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
            fullName,
            email,
            password,
            role
        } = req.body;


        // Accept both name and fullName
        const userName = (
            name || fullName || ""
        ).trim();


        // VALIDATION
        if (!userName || !email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters"
            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // CHECK IF USER EXISTS
        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });


        if (existingUser) {

            return res.status(400).json({
                success: false,
                message:
                    "User already exists with this email"
            });

        }


        // HASH PASSWORD
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // CREATE VERIFICATION CODE
        const verificationCode =
            generateVerificationCode();


        // CODE EXPIRES AFTER 10 MINUTES
        const verificationCodeExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );


        // CREATE USER
        const user = await User.create({

            name: userName,

            email: normalizedEmail,

            password: hashedPassword,

            role: role || "user",

            isVerified: false,

            verificationCode: verificationCode,

            verificationCodeExpires:
                verificationCodeExpires
        });


        // SEND VERIFICATION EMAIL
        try {

            await sendEmail(
                user.email,

                "Verify Your Smart Complaint Management System Account",

                `
                <div style="
                    font-family: Arial, sans-serif;
                    padding: 20px;
                ">

                    <h2>Email Verification</h2>

                    <p>Hello ${user.name || "User"},</p>

                    <p>
                        Your verification code is:
                    </p>

                    <h1 style="
                        color: #2563eb;
                        letter-spacing: 5px;
                    ">
                        ${verificationCode}
                    </h1>

                    <p>
                        This code expires in 10 minutes.
                    </p>

                    <p>
                        Please do not share this code with anyone.
                    </p>

                </div>
                `
            );

        } catch (emailError) {

            console.error(
                "REGISTRATION EMAIL ERROR:",
                emailError.message
            );

        }


        return res.status(201).json({

            success: true,

            message:
                "Registration successful. Please verify your email.",

            user: {
                id: user._id,
                name: user.name,
                fullName: user.name,
                email: user.email,
                role: user.role
            }

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Registration failed"

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
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required"

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // FIND USER
        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // CHECK PASSWORD
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // CHECK EMAIL VERIFICATION
        if (user.isVerified === false) {

            return res.status(403).json({

                success: false,

                needsVerification: true,

                email: user.email,

                message:
                    "Please verify your email before logging in"

            });

        }


        // GENERATE TOKEN WITH USER NAME
        const token =
            generateToken(user);


        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            token: token,

            user: {

                id: user._id,

                name: user.name,

                fullName: user.name,

                email: user.email,

                role: user.role || "user"

            }

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Login failed"

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
            code
        } = req.body;


        if (!email || !code) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and verification code are required"

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        // CHECK CODE
        if (
            user.verificationCode !==
            code.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid verification code"

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
                    "Verification code has expired. Please request a new code."

            });

        }


        // VERIFY USER
        user.isVerified = true;

        user.verificationCode = undefined;

        user.verificationCodeExpires =
            undefined;


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "Email verified successfully. You can now login."

        });


    } catch (error) {

        console.error(
            "VERIFY EMAIL ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Email verification failed"

        });

    }

};


// ==========================================
// RESEND VERIFICATION CODE
// POST /api/auth/resend-verification
// ==========================================

const resendVerificationCode =
    async (req, res) => {

        try {

            const { email } = req.body;


            if (!email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email is required"

                });

            }


            const normalizedEmail =
                email.trim().toLowerCase();


            const user =
                await User.findOne({

                    email: normalizedEmail

                });


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            if (user.isVerified === true) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This email is already verified"

                });

            }


            // CREATE NEW CODE
            const verificationCode =
                generateVerificationCode();


            user.verificationCode =
                verificationCode;


            user.verificationCodeExpires =
                new Date(
                    Date.now() + 10 * 60 * 1000
                );


            await user.save();


            // SEND EMAIL
            await sendEmail(

                user.email,

                "New Verification Code - Smart Complaint Management System",

                `
                <div style="
                    font-family: Arial, sans-serif;
                    padding: 20px;
                ">

                    <h2>Email Verification</h2>

                    <p>
                        Hello ${user.name || "User"},
                    </p>

                    <p>
                        Your new verification code is:
                    </p>

                    <h1 style="
                        color: #2563eb;
                        letter-spacing: 5px;
                    ">
                        ${verificationCode}
                    </h1>

                    <p>
                        This code expires in 10 minutes.
                    </p>

                </div>
                `
            );


            return res.status(200).json({

                success: true,

                message:
                    "New verification code sent successfully"

            });


        } catch (error) {

            console.error(
                "RESEND VERIFICATION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to resend verification code"

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

                message:
                    "Email is required"

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "No user found with this email"

            });

        }


        // GENERATE RESET CODE
        const resetCode =
            generateVerificationCode();


        const resetCodeExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );


        // UPDATE USER
        await User.updateOne(

            {
                _id: user._id
            },

            {
                $set: {

                    resetCode: resetCode,

                    resetCodeExpires:
                        resetCodeExpires

                }
            }

        );


        // SEND EMAIL
        await sendEmail(

            user.email,

            "Password Reset Code - Smart Complaint Management System",

            `
            <div style="
                font-family: Arial, sans-serif;
                padding: 20px;
            ">

                <h2>Password Reset</h2>

                <p>
                    Hello ${user.name || "User"},
                </p>

                <p>
                    Your password reset code is:
                </p>

                <h1 style="
                    color: #2563eb;
                    letter-spacing: 5px;
                ">
                    ${resetCode}
                </h1>

                <p>
                    This code expires in 10 minutes.
                </p>

                <p>
                    If you did not request this,
                    please ignore this email.
                </p>

            </div>
            `
        );


        return res.status(200).json({

            success: true,

            message:
                "Password reset code sent successfully"

        });


    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to send password reset code"

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
            code,
            newPassword
        } = req.body;


        if (!email || !code || !newPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Email, reset code and new password are required"

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters"

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        // CHECK RESET CODE EXISTS
        if (!user.resetCode) {

            return res.status(400).json({

                success: false,

                message:
                    "Please request a password reset code first"

            });

        }


        // CHECK CODE
        if (
            user.resetCode !==
            code.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid reset code"

            });

        }


        // CHECK EXPIRATION
        if (
            !user.resetCodeExpires ||
            user.resetCodeExpires < new Date()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Reset code has expired. Please request a new code."

            });

        }


        // HASH NEW PASSWORD
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        // UPDATE PASSWORD AND REMOVE CODE
        await User.updateOne(

            {
                _id: user._id
            },

            {
                $set: {

                    password:
                        hashedPassword

                },

                $unset: {

                    resetCode: "",

                    resetCodeExpires: ""

                }
            }

        );


        return res.status(200).json({

            success: true,

            message:
                "Password reset successful. Please login with your new password."

        });


    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Password reset failed"

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

    resetPassword

};