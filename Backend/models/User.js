const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },


        // ==========================
        // EMAIL VERIFICATION
        // ==========================

        verificationCode: {
            type: String,
            default: null,
        },

        verificationCodeExpires: {
            type: Date,
            default: null,
        },


        // ==========================
        // PASSWORD RESET
        // ==========================

        resetPasswordCode: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


module.exports =
    mongoose.model("User", userSchema);