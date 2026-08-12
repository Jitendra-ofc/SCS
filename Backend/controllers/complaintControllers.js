const Complaint = require("../models/Complaint");

// ==========================================
// CREATE COMPLAINT
// ==========================================
const createComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.create({
            user: req.user.id,
            name: req.user.name,
            email: req.user.email,

            category: req.body.category,
            subject: req.body.subject,
            description: req.body.description,

            status: "Pending"
        });

        res.status(201).json({
            message: "Complaint Submitted Successfully",
            complaint
        });

    } catch (error) {
        console.error("Create Complaint Error:", error);

        res.status(400).json({
            message: "Complaint validation failed",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL COMPLAINTS
// ==========================================
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .sort({ createdAt: -1 });

        res.status(200).json(complaints);

    } catch (error) {
        console.error("Get All Complaints Error:", error);

        res.status(500).json({
            message: "Failed to fetch complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET USER COMPLAINTS
// ==========================================
const getUserComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json(complaints);

    } catch (error) {
        console.error("Get User Complaints Error:", error);

        res.status(500).json({
            message: "Failed to fetch your complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET COMPLAINT STATISTICS
// ==========================================
const getComplaintStats = async (req, res) => {
    try {
        const total = await Complaint.countDocuments();

        const pending = await Complaint.countDocuments({
            status: "Pending"
        });

        const resolved = await Complaint.countDocuments({
            status: "Resolved"
        });

        const rejected = await Complaint.countDocuments({
            status: "Rejected"
        });

        res.status(200).json({
            total,
            pending,
            resolved,
            rejected
        });

    } catch (error) {
        console.error("Get Complaint Stats Error:", error);

        res.status(500).json({
            message: "Failed to fetch complaint statistics",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE COMPLAINT STATUS
// ==========================================
const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            {
                new: true,
                runValidators: true
            }
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            message: "Complaint status updated successfully",
            complaint
        });

    } catch (error) {
        console.error("Update Complaint Error:", error);

        res.status(400).json({
            message: "Failed to update complaint",
            error: error.message
        });
    }
};


// ==========================================
// DELETE COMPLAINT
// ==========================================
const deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(
            req.params.id
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            message: "Complaint deleted successfully"
        });

    } catch (error) {
        console.error("Delete Complaint Error:", error);

        res.status(500).json({
            message: "Failed to delete complaint",
            error: error.message
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    createComplaint,
    getAllComplaints,
    getUserComplaints,
    getComplaintStats,
    updateComplaintStatus,
    deleteComplaint
};