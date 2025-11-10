import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";
import { setUserPassword, verifyUserPassword } from "../services/localAuth.js";

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

const isSecurityRole = (role = "") =>
  ["security", "security_staff"].includes(String(role).toLowerCase());

const ADMIN_ROLE = "admin";

const readBootstrapKey = () =>
  String(process.env.ADMIN_BOOTSTRAP_KEY || "").trim() || null;

const getAdminBootstrapStatus = async () => {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = $1",
    [ADMIN_ROLE]
  );
  const adminCount = result.rows[0]?.count || 0;
  const bootstrapKey = readBootstrapKey();
  const requireKey = Boolean(bootstrapKey);
  const allowRegistration = adminCount === 0 || requireKey;

  return {
    allowRegistration,
    requireKey,
    adminCount,
  };
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
// 1.1️⃣ Admin Bootstrap Status
// ============================
router.get("/admin-bootstrap-status", async (req, res) => {
  try {
    const status = await getAdminBootstrapStatus();
    res.json(status);
  } catch (err) {
    console.error("Failed to fetch admin bootstrap status:", err);
    res
      .status(500)
      .json({ error: "Failed to determine admin registration status." });
  }
});

// ============================
// 1.2️⃣ Admin Bootstrap Registration
// ============================
router.post("/admin-bootstrap", async (req, res) => {
  try {
    const status = await getAdminBootstrapStatus();
    if (!status.allowRegistration) {
      return res.status(403).json({
        error:
          "Administrator registration is disabled. Contact system support.",
      });
    }

    const { email, password, fullName, bootstrapKey } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!validateUniversityEmail(normalizedEmail)) {
      return res
        .status(400)
        .json({ error: "Email must be a valid @carsu.edu.ph address." });
    }

    if (!password || password.length < 12) {
      return res.status(400).json({
        error: "Admin password must be at least 12 characters long.",
      });
    }

    const configuredKey = readBootstrapKey();
    if (configuredKey) {
      if (!bootstrapKey || String(bootstrapKey).trim() !== configuredKey) {
        return res
          .status(403)
          .json({ error: "Invalid administrator bootstrap key." });
      }
    } else if (status.adminCount > 0) {
      // No configured key but admins already exist -> forbid additional registrations.
      return res.status(403).json({
        error:
          "Administrator registration is locked after the first account. Contact the system maintainer.",
      });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    if (existing.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "An account already exists for this email." });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO users (email, role, full_name, on_duty)
        VALUES ($1, $2, $3, FALSE)
        RETURNING *
      `,
      [normalizedEmail, ADMIN_ROLE, fullName?.trim() || null]
    );

    const user = insertResult.rows[0];
    await setUserPassword(user.id, password);

    const tokenJWT = generateToken(user);
    res.status(201).json({
      message: "Administrator account created successfully.",
      token: tokenJWT,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error("Admin bootstrap registration failed:", err);
    res.status(500).json({ error: "Failed to create administrator account." });
  }
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

    if (isSecurityRole(user.role) && user.on_duty !== true) {
      return res.status(403).json({
        error:
          "Security staff must be marked on duty by an administrator before logging in.",
      });
    }

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
  const { email, password } = req.body;

  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!validateUniversityEmail(normalizedEmail)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const result = await pool.query(
      "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
      [normalizedEmail, "university_member"]
    );
    const user = result.rows[0];

    await setUserPassword(user.id, password);

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
  const { email, role, password } = req.body;

  console.log("Simple login attempt:", email, role);

  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!validateUniversityEmail(normalizedEmail)) {
      return res
        .status(400)
        .json({ error: "Email must be a university address" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
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

    if (isSecurityRole(user.role) && user.on_duty !== true) {
      return res.status(403).json({
        error:
          "Security staff must be marked on duty by an administrator before logging in.",
      });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    const passwordIsValid = await verifyUserPassword(user.id, password);
    if (!passwordIsValid) {
      return res.status(401).json({ error: "Invalid email or password." });
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
