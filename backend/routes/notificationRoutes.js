import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * ✅ GET /api/notifications/:user_id
 * Fetch all notifications for a user with matched item details.
 * Handles both General Items and Student ID categories.
 */
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    // Return existing notifications for the user, and also synthesize
    // notification-like rows for any matches that involve the user's items
    // but don't yet have a notification row. This ensures the frontend
    // will show notifications if there's anything in the matches table.
    const result = await pool.query(
      `
      WITH user_items AS (
        SELECT 
          id,
          reporter_id AS user_id, -- align to expected alias
          name,
          brand,
          color,
          location,
          type,
          image_url,
          student_id,
          user_claim_status
        FROM items
        WHERE reporter_id = $1
      )

      -- 1) Existing notifications
      SELECT
        n.id,
        n.user_id,
        n.item_id,
        n.match_id,
        n.category,
        n.type,
        n.is_read,
        n.created_at,

  i.name AS item_name,
  i.brand,
  i.color,
  i.location AS item_location,
  i.type AS item_type,
  i.image_url AS item_image_url,
  i.student_id AS item_student_id,
  i.reporter_id AS item_user_id, -- align with schema

        matched_i.name AS matched_item_name,
        matched_i.type AS matched_type,
        matched_i.image_url AS matched_image_url,
        matched_i.status AS matched_status,
        matched_i.student_id AS matched_student_id,
    matched_i.location AS matched_location,
  matched_i.description AS matched_description,
  CASE WHEN i.type = 'lost' THEN m.found_item_id ELSE m.lost_item_id END AS matched_item_id,
  i.type AS base_item_type,

    CASE WHEN LOWER(n.category) = 'id' THEN matched_i.image_url ELSE matched_i.image_url END AS display_image,
    CASE WHEN LOWER(n.category) = 'id' THEN matched_i.name ELSE matched_i.name END AS display_name,
  CASE WHEN LOWER(n.category) = 'id' THEN matched_i.student_id ELSE NULL END AS display_student_id,
  matched_i.description AS display_description,
  i.user_claim_status AS base_user_claim_status,
  matched_i.user_claim_status AS matched_user_claim_status

      FROM notifications n
      LEFT JOIN items i ON n.item_id = i.id
      LEFT JOIN matches m ON n.match_id = m.id
      LEFT JOIN items matched_i ON (
        CASE WHEN i.type = 'lost' THEN m.found_item_id ELSE m.lost_item_id END = matched_i.id
      )
      WHERE n.user_id = $1

      UNION

      -- 2) Matches involving the user's items that do not have a notification yet
      SELECT
        NULL::uuid AS id,
        $1::uuid AS user_id,
        ui.id AS item_id,
        m.id AS match_id,
        CASE WHEN COALESCE(matched_i.student_id, '') <> '' THEN 'id' ELSE 'general' END AS category,
        'match_generated' AS type,
        FALSE AS is_read,
        m.created_at AS created_at,

        ui.name AS item_name,
        ui.brand,
        ui.color,
        ui.location AS item_location,
        ui.type AS item_type,
        ui.image_url AS item_image_url,
        ui.student_id AS item_student_id,
        ui.user_id AS item_user_id,

        matched_i.name AS matched_item_name,
        matched_i.type AS matched_type,
        matched_i.image_url AS matched_image_url,
        matched_i.status AS matched_status,
        matched_i.student_id AS matched_student_id,
    matched_i.location AS matched_location,
  matched_i.description AS matched_description,
  matched_i.id AS matched_item_id,
  ui.type AS base_item_type,

    matched_i.image_url AS display_image,
  matched_i.name AS display_name,
  CASE WHEN COALESCE(matched_i.student_id, '') <> '' THEN matched_i.student_id ELSE NULL END AS display_student_id,
  matched_i.description AS display_description,
  ui.user_claim_status AS base_user_claim_status,
  matched_i.user_claim_status AS matched_user_claim_status

      FROM matches m
      JOIN user_items ui ON (ui.id = m.lost_item_id OR ui.id = m.found_item_id)
      JOIN items matched_i ON (
        CASE WHEN ui.id = m.lost_item_id THEN m.found_item_id ELSE m.lost_item_id END = matched_i.id
      )
      WHERE m.id NOT IN (
        SELECT match_id FROM notifications WHERE user_id = $1 AND match_id IS NOT NULL
      )
      AND (
        matched_i.name IS NOT NULL
        OR matched_i.student_id IS NOT NULL
        OR matched_i.image_url IS NOT NULL
      )

      ORDER BY created_at DESC;
      `,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * ✅ PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put("/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

/**
 * 🆕 PUT /api/notifications/:id/claim
 * Allows user to initiate a claim directly from their notification
 * and emits a Socket.IO event to the security dashboard
 */
router.put("/:id/claim", async (req, res) => {
  const { id } = req.params; // notification ID
  const { claimant_id } = req.body;

  try {
    // ✅ Validate claimant_id
    if (!claimant_id) {
      return res.status(400).json({ message: "Claimant ID is required" });
    }

    // ✅ Find related item from the notification
    const notification = await pool.query(
      `SELECT item_id FROM notifications WHERE id = $1`,
      [id]
    );

    if (notification.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const itemId = notification.rows[0].item_id;

    // ✅ Update item’s claim status
    const result = await pool.query(
      `
      UPDATE items
      SET user_claim_status = 'pending_claim',
          claimant_id = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
      `,
      [claimant_id, itemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedItem = result.rows[0];

    // ✅ Fetch claimant info
    const claimantRes = await pool.query(
      `SELECT id, full_name, email FROM users WHERE id = $1`,
      [claimant_id]
    );

    const claimant = claimantRes.rowCount ? claimantRes.rows[0] : null;

    // ✅ Log for debugging
    console.log(
      `➡️ Claim request from claimant ${claimant_id} for item ${itemId}`
    );

    // ✅ Emit real-time update to the Security Dashboard
    const io = req.app.get("io");
    if (io) {
      io.emit("claimStatusUpdated", {
        item_id: updatedItem.id,
        user_claim_status: updatedItem.user_claim_status,
        claimant_id: updatedItem.claimant_id,
        claimant_name: claimant?.full_name || "Unknown",
        claimant_email: claimant?.email || null,
        claimant_student_id: claimant?.student_id || null,
        student_id: updatedItem.student_id || null, // ✅ Include student_id if the item is an ID
      });
    }

    res.status(200).json({
      message: "Claim initiated successfully via notification",
      item: updatedItem,
      claimant,
    });
  } catch (err) {
    console.error("❌ Error initiating claim from notification:", err);
    res.status(500).json({ error: "Failed to initiate claim" });
  }
});

export default router;
