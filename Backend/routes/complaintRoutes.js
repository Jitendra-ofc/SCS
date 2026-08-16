const express = require("express");

const router = express.Router();

const protect =
    require("../middleware/authMiddleware");


const {
    createComplaint,
    getAllComplaints,
    getUserComplaints,
    getComplaintStats,
    updateComplaintStatus,
    deleteComplaint
} = require(
    "../controllers/complaintControllers"
);


// ==========================================
// CREATE COMPLAINT
// POST /api/complaints
// ==========================================
router.post(
    "/",
    protect,
    createComplaint
);


// ==========================================
// GET ALL COMPLAINTS
// GET /api/complaints
// ==========================================
router.get(
    "/",
    protect,
    getAllComplaints
);


// ==========================================
// GET CURRENT USER COMPLAINTS
// GET /api/complaints/my
// ==========================================
router.get(
    "/my",
    protect,
    getUserComplaints
);


// ==========================================
// GET COMPLAINT STATISTICS
// GET /api/complaints/stats
// ==========================================
router.get(
    "/stats",
    protect,
    getComplaintStats
);


// ==========================================
// UPDATE COMPLAINT STATUS
// PUT /api/complaints/:id
// ==========================================
router.put(
    "/:id",
    protect,
    updateComplaintStatus
);


// ==========================================
// DELETE COMPLAINT
// DELETE /api/complaints/:id
// ==========================================
router.delete(
    "/:id",
    protect,
    deleteComplaint
);


// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;