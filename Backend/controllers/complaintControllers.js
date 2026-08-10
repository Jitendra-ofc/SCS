const Complaint = require("../models/Complaint");

// ================================
// Create Complaint
// ================================
const createComplaint = async (req, res) => {

    try {

        const complaint = await Complaint.create({

            name: req.user.fullName,
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

        res.status(500).json({

            message: error.message

        });

    }

};

// ================================
// Get All Complaints
// ================================
const getAllComplaints = async (req, res) => {

    try {

        const complaints = await Complaint.find().sort({ createdAt: -1 });

        res.json(complaints);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// ================================
// Get User Complaints
// ================================
const getUserComplaints = async (req, res) => {

    try {

        const complaints = await Complaint.find({

            email: req.user.email

        }).sort({ createdAt: -1 });

        res.json(complaints);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// ================================
// Update Complaint Status
// ================================
const updateComplaintStatus = async (req, res) => {

    try {

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {

            return res.status(404).json({
                message: "Complaint Not Found"
            });

        }

        complaint.status = req.body.status;

        await complaint.save();

        res.json({
            message: "Status Updated Successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// ================================
// Dashboard Statistics
// ================================
const getComplaintStats = async (req, res) => {

    try {

        const total = await Complaint.countDocuments();

        const pending = await Complaint.countDocuments({
            status: "Pending"
        });

        const progress = await Complaint.countDocuments({
            status: "In Progress"
        });

        const resolved = await Complaint.countDocuments({
            status: "Resolved"
        });

        res.json({

            total,
            pending,
            progress,
            resolved

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};

// ================================
// Export
// ================================
module.exports = {

    createComplaint,
    getAllComplaints,
    getUserComplaints,
    updateComplaintStatus,
    getComplaintStats

};