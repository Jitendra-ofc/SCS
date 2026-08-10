const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved"],
    default: "Pending"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Complaint", complaintSchema);