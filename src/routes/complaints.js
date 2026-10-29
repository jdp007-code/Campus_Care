import { Router } from "express";
import Complaint from "../models/Complaint.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res) => {
  const filter = ["admin", "staff"].includes(req.user.role) ? {} : { student: req.user._id };
  const complaints = await Complaint.find(filter).populate("student", "name email").sort({ createdAt: -1 });
  res.json({ complaints });
});

router.post("/", async (req, res) => {
  try {
    const { title, category, location, description, priority } = req.body;
    if (![title, category, location, description].every(v => String(v || "").trim()))
      return res.status(400).json({ message: "Please complete all required fields." });
    const complaint = await Complaint.create({
      title, category, location, description,
      priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
      student: req.user._id
    });
    res.status(201).json({ complaint });
  } catch (err) {
    res.status(400).json({ message: "Could not submit complaint.", detail: err.message });
  }
});

router.patch("/:id/status", (req, res, next) => ["admin", "staff"].includes(req.user.role) ? next() : res.status(403).json({ message: "Staff access required." }), async (req, res) => {
  const allowed = ["Submitted", "In Review", "In Progress", "Resolved", "Rejected"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status." });
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    .populate("student", "name email");
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });
  res.json({ complaint });
});

export default router;
