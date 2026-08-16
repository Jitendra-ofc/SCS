const Complaint = require("../models/Complaint");


// ==========================================
// CREATE COMPLAINT
// ==========================================

const createComplaint = async (req, res) => {
    try {
        console.log(
            "Creating complaint for user:",
            req.user
        );

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        const name =
            req.user.name ||
            req.user.fullName ||
            "";

        if (!name) {
            return res.status(400).json({
                message:
                    "User name is missing from authentication token"
            });
        }

        const {
            category,
            subject,
            description
        } = req.body;

        if (
            !category ||
            !subject ||
            !description
        ) {
            return res.status(400).json({
                message:
                    "Category, subject and description are required"
            });
        }

        const complaint = await Complaint.create({
            user: req.user.id,
            name: name,
            email: req.user.email,
            category,
            subject,
            description,
            status: "Pending"
        });

        console.log(
            "Complaint created successfully:",
            complaint
        );

        return res.status(201).json({
            message: "Complaint Submitted Successfully",
            complaint
        });

    } catch (error) {
        console.error(
            "Create complaint error:",
            error
        );

        return res.status(500).json({
            message: "Failed to submit complaint",
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
            .sort({
                createdAt: -1
            });

        return res.status(200).json(
            complaints
        );

    } catch (error) {
        console.error(
            "Get All Complaints Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET USER COMPLAINTS
// ==========================================

const getUserComplaints = async (
    req,
    res
) => {
    try {
        console.log(
            "Getting complaints for user:",
            req.user
        );

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        const complaints = await Complaint.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        console.log(
            "User complaints found:",
            complaints.length
        );

        return res.status(200).json(
            complaints
        );

    } catch (error) {
        console.error(
            "Get User Complaints Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch your complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET COMPLAINT STATISTICS
// ==========================================

const getComplaintStats = async (
    req,
    res
) => {
    try {
        const total =
            await Complaint.countDocuments();

        const pending =
            await Complaint.countDocuments({
                status: "Pending"
            });

        const inProgress =
            await Complaint.countDocuments({
                status: "In Progress"
            });

        const resolved =
            await Complaint.countDocuments({
                status: "Resolved"
            });

        return res.status(200).json({
            total,
            pending,
            inProgress,
            resolved
        });

    } catch (error) {
        console.error(
            "Get Complaint Stats Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch complaint statistics",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE COMPLAINT STATUS
// ==========================================

const updateComplaintStatus = async (
    req,
    res
) => {
    try {
        const { status } = req.body;

        const complaint =
            await Complaint.findByIdAndUpdate(
                req.params.id,
                {
                    status
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!complaint) {
            return res.status(404).json({
                message:
                    "Complaint not found"
            });
        }

        return res.status(200).json({
            message:
                "Complaint status updated successfully",
            complaint
        });

    } catch (error) {
        console.error(
            "Update Complaint Error:",
            error
        );

        return res.status(400).json({
            message:
                "Failed to update complaint",
            error: error.message
        });
    }
};


// ==========================================
// DELETE COMPLAINT
// ==========================================

const deleteComplaint = async (
    req,
    res
) => {
    try {
        const complaint =
            await Complaint.findByIdAndDelete(
                req.params.id
            );

        if (!complaint) {
            return res.status(404).json({
                message:
                    "Complaint not found"
            });
        }

        return res.status(200).json({
            message:
                "Complaint deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Complaint Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete complaint",
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