const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {

    createComplaint,
    getAllComplaints,
    getUserComplaints,
    updateComplaintStatus,
    getComplaintStats

} = require("../controllers/complaintControllers");


// ===============================
// Complaint Routes
// ===============================

// User submits complaint
router.post("/", protect, createComplaint);

// Admin views all complaints
router.get("/", protect, getAllComplaints);

// User views own complaints
router.get("/my", protect, getUserComplaints);

// Admin Dashboard Statistics
router.get("/stats", protect, getComplaintStats);

// Admin updates complaint status
router.put("/:id", protect, updateComplaintStatus);


module.exports = router;