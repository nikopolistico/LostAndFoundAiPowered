import bcrypt from "bcrypt";
import pool from "../db.js";

const SALT_ROUNDS = 10;

export const setUserPassword = async (userId, rawPassword) => {
  if (!rawPassword || typeof rawPassword !== "string") {
    throw new Error("Password is required");
  }

  const hash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
  await pool.query(
    `
      INSERT INTO user_credentials (user_id, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
    `,
    [userId, hash]
  );
};

export const getUserPasswordHash = async (userId) => {
  const result = await pool.query(
    "SELECT password_hash FROM user_credentials WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.password_hash || null;
};

export const verifyUserPassword = async (userId, candidatePassword) => {
  const hash = await getUserPasswordHash(userId);
  if (!hash) return false;
  return bcrypt.compare(candidatePassword, hash);
};
