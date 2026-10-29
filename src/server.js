import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import complaintRoutes from "./routes/complaints.js";

dotenv.config();
const app = express();
const allowedOrigins = new Set([process.env.CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://192.168.1.13:5174"].filter(Boolean));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CampusCare CORS policy."));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "CampusCare API" }));
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.warn("Admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    return;
  }
  const exists = await User.findOne({ email });
  if (!exists) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name: process.env.ADMIN_NAME || "CampusCare Admin",
      email, passwordHash, role: "admin"
    });
    console.log(`Created admin account for ${email}`);
  }
}

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campuscare")
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedAdmin();
    app.listen(port, () => console.log(`CampusCare API listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
