import express from "express";
import { authenticateJWT } from "../middleware/authenticateJWT.js";
import pool from "../db.js";
import fs from "fs";
import path from "path";

const router = express.Router();

const validateUniversityEmail = (email = "") =>
  String(email).toLowerCase().trim().endsWith("@carsu.edu.ph");

// ========================
// 🔹 Get All Users (For Admin Dashboard)
// ========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        full_name,
        email,
        role,
        user_type,
        department,
        contact_number,
        birthday,
        profile_picture,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 🔹 Register Security Staff (Admin Only)
// ========================
router.post("/staff", authenticateJWT, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      email,
      full_name: fullName,
      department,
      contact_number: contactNumber,
    } = req.body || {};

    if (!email || !validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "A valid university email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      `SELECT id, role, full_name, department, contact_number
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      const current = existingUser.rows[0];

      if (current.role === "security" || current.role === "security_staff") {
        return res.status(409).json({
          error: "This email is already registered as security staff",
        });
      }

      const updated = await pool.query(
        `UPDATE users
         SET role = $1,
             full_name = COALESCE($2, full_name),
             department = COALESCE($3, department),
             contact_number = COALESCE($4, contact_number)
         WHERE id = $5
         RETURNING id, full_name, email, role, department, contact_number, created_at`,
        [
          "security",
          fullName || null,
          department || null,
          contactNumber || null,
          current.id,
        ]
      );

      return res.json({
        message: "Existing user elevated to security staff",
        user: updated.rows[0],
      });
    }

    const inserted = await pool.query(
      `INSERT INTO users (email, role, full_name, department, contact_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, department, contact_number, created_at`,
      [
        normalizedEmail,
        "security",
        fullName || null,
        department || null,
        contactNumber || null,
      ]
    );

    return res.status(201).json({
      message: "Security staff registered",
      user: inserted.rows[0],
    });
  } catch (err) {
    console.error("❌ Error registering staff:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 🔹 Assign Role (Testing - No Guard)
// ========================
router.put("/:id/assign-role", authenticateJWT, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["security", "university_member"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, full_name, email, role`,
      [role, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: `✅ Role updated to ${role}`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error assigning role:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 🔹 Delete User (Testing - No Guard)
// ========================
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // Get profile picture path
    const userRes = await pool.query(
      "SELECT profile_picture FROM users WHERE id=$1",
      [id]
    );

    if (!userRes.rows.length)
      return res.status(404).json({ error: "User not found" });

    const profilePic = userRes.rows[0].profile_picture;

    // Delete user from DB
    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    // Delete profile picture from filesystem (if exists)
    if (profilePic) {
      const absolutePath = path.join(process.cwd(), profilePic);
      fs.access(absolutePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(absolutePath, (unlinkErr) => {
            if (unlinkErr)
              console.error("❌ Error deleting profile picture:", unlinkErr);
          });
        }
      });
    }

    res.json({ message: "✅ User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
