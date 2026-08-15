const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        // Email verification
        isVerified: {
            type: Boolean,
            default: false
        },

        verificationCode: {
            type: String,
            default: null
        },

        verificationCodeExpires: {
            type: Date,
            default: null
        },

        // Forgot password
        resetPasswordCode: {
            type: String,
            default: null
        },

        resetPasswordCodeExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);