require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");

// Fix DNS lookup for MongoDB Atlas
dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error);
    });

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});