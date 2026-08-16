const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);


require("dotenv").config();


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");


const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");


const app = express();


const PORT = process.env.PORT || 5000;


// ==========================================
// CORS CONFIGURATION
// MUST COME BEFORE ALL ROUTES
// ==========================================

app.use(cors({
    origin: true,
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));


// ==========================================
// HANDLE PREFLIGHT REQUESTS
// ==========================================

app.options("*", cors());


// ==========================================
// BODY MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ==========================================
// STATIC FILES
// ==========================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/complaints",
    complaintRoutes
);


// ==========================================
// HOME TEST ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Smart Complaint System API is running"
    });

});


// ==========================================
// API TEST ROUTE
// ==========================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "API is working"
    });

});


// ==========================================
// DATABASE + SERVER
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB Connected Successfully"
        );


        app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "MongoDB Connection Error:",
            error.message
        );


        process.exit(1);

    });