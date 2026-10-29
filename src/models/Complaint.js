import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: ["Hostel", "Classroom", "Cleanliness", "IT / Wi-Fi", "Maintenance", "Safety", "Other"], required: true },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Submitted", "In Review", "In Progress", "Resolved", "Rejected"], default: "Submitted" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);
