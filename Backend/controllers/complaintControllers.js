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

        // CHECK AUTHENTICATION
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }


        // CHECK USER NAME
        if (!req.user.fullName) {
            return res.status(400).json({
                success: false,
                message: "User name could not be found"
            });
        }


        // GET COMPLAINT DATA
        const {
            category,
            subject,
            description
        } = req.body;


        // VALIDATION
        if (
            !category ||
            !subject ||
            !description
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Category, subject and description are required"
            });
        }


        // CREATE COMPLAINT
        const complaint =
            await Complaint.create({

                user: req.user.id,

                name: req.user.fullName,

                email: req.user.email,

                category: category,

                subject: subject,

                description: description,

                status: "Pending"
            });


        return res.status(201).json({
            success: true,
            message:
                "Complaint Submitted Successfully",
            complaint
        });

    } catch (error) {

        console.error(
            "CREATE COMPLAINT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
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

        const complaints =
            await Complaint.find()
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({
            success: true,
            complaints
        });

    } catch (error) {

        console.error(
            "GET ALL COMPLAINTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET USER COMPLAINTS
// ==========================================
const getUserComplaints = async (req, res) => {
    try {

        // CHECK AUTHENTICATION
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }


        // GET ONLY CURRENT USER COMPLAINTS
        const complaints =
            await Complaint.find({
                user: req.user.id
            })
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({
            success: true,
            complaints
        });

    } catch (error) {

        console.error(
            "GET USER COMPLAINTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch your complaints",
            error: error.message
        });
    }
};


// ==========================================
// GET COMPLAINT STATISTICS
// ==========================================
const getComplaintStats = async (req, res) => {
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
            success: true,
            total,
            pending,
            inProgress,
            resolved
        });

    } catch (error) {

        console.error(
            "GET COMPLAINT STATS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch complaint statistics",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE COMPLAINT STATUS
// ==========================================
const updateComplaintStatus = async (req, res) => {
    try {

        const {
            status
        } = req.body;


        // VALID STATUS VALUES
        const validStatuses = [
            "Pending",
            "In Progress",
            "Resolved"
        ];


        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status"
            });
        }


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
                success: false,
                message: "Complaint not found"
            });
        }


        return res.status(200).json({
            success: true,
            message:
                "Complaint status updated successfully",
            complaint
        });

    } catch (error) {

        console.error(
            "UPDATE COMPLAINT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update complaint",
            error: error.message
        });
    }
};


// ==========================================
// DELETE COMPLAINT
// ==========================================
const deleteComplaint = async (req, res) => {
    try {

        const complaint =
            await Complaint.findByIdAndDelete(
                req.params.id
            );


        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }


        return res.status(200).json({
            success: true,
            message:
                "Complaint deleted successfully"
        });

    } catch (error) {

        console.error(
            "DELETE COMPLAINT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete complaint",
            error: error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    createComplaint,
    getAllComplaints,
    getUserComplaints,
    getComplaintStats,
    updateComplaintStatus,
    deleteComplaint
};