const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

const app = express();

// Render provides PORT automatically.
// Locally, it uses port 5000.
const PORT = process.env.PORT || 5000;


// ===============================
// MIDDLEWARE
// ===============================

// Allow your frontend to access this backend
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ===============================
// STATIC UPLOADS
// ===============================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);


// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Complaint System API is running"
    });
});


// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error.message);
    });