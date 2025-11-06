import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================
// Utility Functions
// ============================
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const msg =
      "JWT_SECRET environment variable is not set. Set JWT_SECRET in your .env (or environment) before starting the server.";
    console.error(msg);
    // Throw so caller (and logs) show a clear stack trace pointing to this code path
    throw new Error(msg);
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const validateUniversityEmail = (email) => {
  return email.endsWith("@carsu.edu.ph");
};

// ============================
// 1️⃣ Get Google Client ID
// ============================
router.get("/google-client-id", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const msg =
      "GOOGLE_CLIENT_ID environment variable is not set on the server.";
    console.error(msg);
    return res.status(500).json({ error: msg });
  }

  res.json({ clientId });
});

// ============================
// 2️⃣ Google Login
// ============================
router.post("/google-login", async (req, res) => {
  const { token, role } = req.body;

  if (!token)
    return res.status(400).json({ error: "Google ID token is required" });
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "User not found. Please register first." });
    }

    const user = existing.rows[0];

    if (user.role !== role) {
      return res
        .status(403)
        .json({ error: "Login failed: role does not match." });
    }

    const tokenJWT = generateToken(user);
    res.json({
      message: "Login successful",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

// ============================
// 3️⃣ Google Register
// ============================
router.post("/google-register", async (req, res) => {
  const { token, role } = req.body;

  if (!token)
    return res.status(400).json({ error: "Google ID token is required" });

  const normalizedRole = role?.trim().toLowerCase();
  if (!normalizedRole)
    return res.status(400).json({ error: "Role is required" });

  // Only allow end-users to self-register; staff accounts are handled by the admin panel.
  if (normalizedRole !== "university_member") {
    return res.status(403).json({
      error:
        "Only university members can self-register. Please contact an administrator for staff access.",
    });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "User already registered" });
    }

    const result = await pool.query(
      "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
      [email, normalizedRole]
    );
    const user = result.rows[0];

    const tokenJWT = generateToken(user);
    res.json({
      message: "Registration successful",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Google registration failed:", err);
    res.status(500).json({ error: "Google registration failed" });
  }
});

// ============================
// 4️⃣ Development Login (Bypass Google)
// ============================
router.post("/dev-login", async (req, res) => {
  const { email, role } = req.body;

  try {
    if (!validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    let result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    let user = result.rows[0];

    if (!user) {
      const newUser = await pool.query(
        "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
        [email, role]
      );
      user = newUser.rows[0];
    } else if (user.role !== role) {
      const updated = await pool.query(
        "UPDATE users SET role = $1 WHERE email = $2 RETURNING *",
        [role, email]
      );
      user = updated.rows[0];
    }

    const tokenJWT = generateToken(user);
    res.json({
      message: "Development login successful",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Development login error:", err);
    res.status(500).json({ error: "Server error during development login" });
  }
});

// ============================
// 5️⃣ Simple Register (Manual)
// ============================
router.post("/simple-register", async (req, res) => {
  const { email } = req.body;

  try {
    if (!validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const result = await pool.query(
      "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
      [email, "university_member"]
    );
    const user = result.rows[0];

    res.json({
      message: "Registration successful",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Simple registration error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ============================
// 6️⃣ Simple Login (Manual)
// ============================
router.post("/simple-login", async (req, res) => {
  const { email, role } = req.body;

  console.log("Simple login attempt:", email, role);

  try {
    if (!validateUniversityEmail(email)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "User not found. Please register first." });
    }

    const user = result.rows[0];
    if (user.role !== role) {
      return res
        .status(403)
        .json({ error: "Login failed: role does not match." });
    }

    const tokenJWT = generateToken(user);
    res.json({
      message: "Login successful",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Simple login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
