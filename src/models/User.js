import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "staff", "admin"], default: "student" },
  phone: { type: String, trim: true, maxlength: 25, default: "" },
  department: { type: String, trim: true, maxlength: 100, default: "" },
  studentId: { type: String, trim: true, maxlength: 50, default: "" },
  designation: { type: String, trim: true, maxlength: 100, default: "" },
  hostelBlock: { type: String, trim: true, maxlength: 100, default: "" },
  bio: { type: String, trim: true, maxlength: 300, default: "" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
