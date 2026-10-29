import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
const safeUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  phone: u.phone || "", department: u.department || "", studentId: u.studentId || "",
  designation: u.designation || "", hostelBlock: u.hostelBlock || "", bio: u.bio || ""
});
const makeToken = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 8)
      return res.status(400).json({ message: "Enter your name, a valid email, and a password of at least 8 characters." });
    if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists." });
    // Public registration always creates a student; users cannot self-assign admin role.
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "student" });
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Could not create account.", detail: err.message });
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  const requestedRole = String(req.body.role || "student").toLowerCase();
  if (!["student", "staff", "admin"].includes(requestedRole))
    return res.status(400).json({ message: "Choose a valid account type." });
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid email or password." });
  if (user.role !== requestedRole)
    return res.status(403).json({ message: `This account is registered as ${user.role}. Choose the matching login option.` });
  res.json({ token: makeToken(user), user: safeUser(user) });
});

router.get("/me", protect, (req, res) => res.json({ user: safeUser(req.user) }));

// Update editable profile fields for the signed-in account.
router.patch("/profile", protect, async (req, res) => {
  const fields = ["name", "phone", "department", "studentId", "designation", "hostelBlock", "bio"];
  const updates = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
  }
  if (updates.name !== undefined && !updates.name) return res.status(400).json({ message: "Name cannot be empty." });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ user: safeUser(user) });
});

// Admin-only creation route; public signup cannot create an admin account.
router.post("/admin-create", protect, adminOnly, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  if (!name || !email || password.length < 8)
    return res.status(400).json({ message: "Name, valid email, and password (8+ characters) are required." });
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already exists." });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
  res.status(201).json({ user: safeUser(user) });
});

router.post("/staff-create", protect, adminOnly, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  if (!name || !email || password.length < 8) return res.status(400).json({ message: "Name, email and password (8+ characters) are required." });
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already exists." });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "staff" });
  res.status(201).json({ user: safeUser(user) });
});

export default router;
