import express from "express";
import multer from "multer";
import pool from "../db.js";
import path from "path";
import fs from "fs";
import { authenticateJWT } from "../middleware/authenticateJWT.js";

const router = express.Router();

// ========================
// 📸 Multer Storage Config
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/profile_pictures");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ========================
// 👤 GET Profile (Logged-in user)
// ========================
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 👀 GET Profile by ID (Public for security staff)
// ========================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching profile by ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 💾 POST Save/Update Profile
// ========================
router.post("/save", authenticateJWT, upload.single("profile_picture"), async (req, res) => {
  try {
    const { full_name, user_type, department, contact_number, birthday } = req.body;
    let profile_picture = null;

    // ✅ Step 1: Fetch old profile picture path (if exists)
    const userResult = await pool.query("SELECT profile_picture FROM users WHERE id=$1", [req.user.id]);
    const oldPicturePath = userResult.rows[0]?.profile_picture;

    // ✅ Step 2: Set new file path if a file was uploaded
    if (req.file) {
      profile_picture = `/uploads/profile_pictures/${req.file.filename}`;

      // ✅ Step 3: Delete the old file safely (if exists)
      if (oldPicturePath) {
        const absoluteOldPath = path.join(process.cwd(), oldPicturePath);
        fs.access(absoluteOldPath, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.unlink(absoluteOldPath, (unlinkErr) => {
              if (unlinkErr) console.error("❌ Error deleting old picture:", unlinkErr);
              else console.log("🗑️ Old profile picture deleted:", absoluteOldPath);
            });
          }
        });
      }
    }

    // ✅ Step 4: Build update query dynamically
    let query = `
      UPDATE users 
      SET full_name=$1, user_type=$2, department=$3, contact_number=$4, birthday=$5
    `;
    const values = [full_name, user_type, department, contact_number, birthday];

    if (profile_picture) {
      query += `, profile_picture=$6 WHERE id=$7 RETURNING *`;
      values.push(profile_picture, req.user.id);
    } else {
      query += ` WHERE id=$6 RETURNING *`;
      values.push(req.user.id);
    }

    // ✅ Step 5: Update DB record
    const result = await pool.query(query, values);
    res.json({ message: "✅ Profile updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
