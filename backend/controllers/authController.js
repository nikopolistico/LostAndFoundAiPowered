import pool from "../db.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Register
export const googleRegister = async (req, res) => {
  const { token, role } = req.body;
  if (!token) return res.status(400).json({ error: "Google ID token is required" });
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email.endsWith("@carsu.edu.ph")) {
      return res.status(400).json({ error: "Email must be a university address" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    let user;

    if (existing.rowCount === 0) {
      const result = await pool.query(
        "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
        [email, role]
      );
      user = result.rows[0];
    } else {
      user = existing.rows[0];
    }

    const tokenJWT = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "User registered/logged in successfully",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Google registration failed:", err);
    res.status(500).json({ error: "Google registration failed" });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  const { token, role } = req.body;
  if (!token) return res.status(400).json({ error: "Google ID token is required" });
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email.endsWith("@carsu.edu.ph")) {
      return res.status(400).json({ error: "Email must be a university address" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "User not found. Please register first." });
    }

    const user = existing.rows[0];

    if (user.role !== role) {
      return res.status(403).json({
        error: `Login failed: role does not match.`,
      });
    }

    const tokenJWT = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token: tokenJWT,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ error: "Google login failed" });
  }
};
