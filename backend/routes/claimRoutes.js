import express from "express";
import pool from "../db.js";

const router = express.Router();

let ensuredClaimMessageColumn = false;

async function ensureClaimMessageColumn() {
  if (ensuredClaimMessageColumn) return;
  try {
    await pool.query(
      "ALTER TABLE claims ADD COLUMN IF NOT EXISTS claimant_message TEXT"
    );
    await pool.query(
      "ALTER TABLE claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"
    );
  } catch (err) {
    console.error("⚠️ Failed to ensure claims optional columns:", err);
  } finally {
    ensuredClaimMessageColumn = true;
  }
}

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

async function getRelatedItemIds(itemId) {
  const ids = new Set();
  if (itemId && typeof itemId === "string" && uuidRegex.test(itemId)) {
    ids.add(itemId);
  }

  if (!itemId) return Array.from(ids);

  try {
    const matchRes = await pool.query(
      `SELECT lost_item_id, found_item_id
       FROM matches
       WHERE lost_item_id = $1 OR found_item_id = $1`,
      [itemId]
    );

    for (const row of matchRes.rows) {
      if (row.lost_item_id && uuidRegex.test(row.lost_item_id)) {
        ids.add(row.lost_item_id);
      }
      if (row.found_item_id && uuidRegex.test(row.found_item_id)) {
        ids.add(row.found_item_id);
      }
    }
  } catch (err) {
    console.error("⚠️ Failed to resolve related item IDs from matches:", err);
  }

  return Array.from(ids);
}

// Simple logger for any request that reaches this router
router.use((req, res, next) => {
  try {
    console.debug(
      `[claims] router hit: ${req.method} ${req.originalUrl} from ${
        req.ip || "unknown"
      }`
    );
  } catch (e) {
    // swallow logging errors
  }
  next();
});

// DEBUG: quick route check
router.get("/debug", (req, res) => {
  res.status(200).json({ ok: true, route: "/api/claims/debug" });
});

/**
 * @route POST /api/claims
 * @desc Create a new claim request
 */
// Emit real-time notification for matched items
const emitRealTimeNotification = async (io, userId, itemId, matchDetails) => {
  try {
    const payload = {
      user_id: userId,
      item_id: itemId,
      match_details: matchDetails,
    };
    io.emit("itemMatched", payload);
    console.log(
      `Real-time notification sent for user ${userId} and item ${itemId}`
    );
  } catch (error) {
    console.error("❌ Error emitting real-time notification:", error);
  }
};

router.post("/", async (req, res) => {
  try {
    await ensureClaimMessageColumn();

    const { user_id, item_id, notification_id, message } = req.body;

    if (!user_id || !item_id || !notification_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Prevent duplicate claim
    const relatedForDupCheck = await getRelatedItemIds(item_id);
    const sanitizedDupCheck = relatedForDupCheck.filter((id) =>
      uuidRegex.test(id)
    );

    if (sanitizedDupCheck.length === 0) {
      console.warn(
        `[claims] Duplicate prevention fallback – using direct item check for ${item_id}`
      );

      const fallbackExisting = await pool.query(
        `SELECT 1 FROM claims WHERE user_id = $1 AND item_id = $2 LIMIT 1`,
        [user_id, item_id]
      );

      if (fallbackExisting.rows.length > 0) {
        return res.status(409).json({ message: "Claim already exists" });
      }
    } else {
      const existingClaim = await pool.query(
        `SELECT 1 FROM claims
         WHERE user_id = $1 AND item_id = ANY($2::uuid[])
         LIMIT 1`,
        [user_id, sanitizedDupCheck]
      );

      if (existingClaim.rows.length > 0) {
        return res.status(409).json({ message: "Claim already exists" });
      }
    }

    // Insert new claim (message is optional in payload but may not have a DB column)
    const result = await pool.query(
      `INSERT INTO claims (user_id, item_id, notification_id, claimant_message, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING *`,
      [user_id, item_id, notification_id, message || null]
    );

    // Update item's user_claim_status
    await pool.query(
      `UPDATE items SET user_claim_status = 'pending_claim', updated_at = NOW() WHERE id = $1`,
      [item_id]
    );

    const newClaim = result.rows[0];

    // Prepare a friendly suggestion for the claimant
    const claimantSuggestion =
      "Your claim request was submitted. Please visit the Security Office for verification and to complete the claiming process.";

    // Emit real-time notification for the claim to the Security dashboard
    // Use the same event payload shape as the /item/:item_id route for consistency
    try {
      const io = req.app.get("io");
      if (io) {
        const claimDetailRes = await pool.query(
          `
          SELECT 
            c.id AS claim_id,
            c.status,
            c.created_at,
            c.claimant_message,
            u.full_name AS claimant_name,
            u.email AS claimant_email,
            u.contact_number AS claimant_contact,
            u.department AS claimant_department,
            i.id AS item_id,
            i.type AS item_type,
            i.category AS item_category,
            i.image_url AS item_image,
            n.id AS notification_id,
            n.item_id AS notification_item_id,
            CASE
              WHEN m.lost_item_id = c.item_id THEN m.found_item_id
              WHEN m.found_item_id = c.item_id THEN m.lost_item_id
              ELSE NULL
            END AS notification_matched_item_id,
            m.lost_item_id,
            m.found_item_id
          FROM claims c
          JOIN users u ON c.user_id = u.id
          JOIN items i ON c.item_id = i.id
          JOIN notifications n ON c.notification_id = n.id
          LEFT JOIN LATERAL (
            SELECT lost_item_id, found_item_id
            FROM matches
            WHERE c.item_id IN (lost_item_id, found_item_id)
            LIMIT 1
          ) m ON TRUE
          WHERE c.id = $1
          LIMIT 1
        `,
          [newClaim.id]
        );

        const claimDetail = claimDetailRes.rows[0] || null;
        if (claimDetail) {
          io.emit("newClaimRequest", claimDetail);
        }
      }
    } catch (emitErr) {
      console.error(
        "❌ Error emitting newClaimRequest to security dashboard:",
        emitErr
      );
    }

    // Optional: still emit the generic event for other listeners
    try {
      const io = req.app.get("io");
      if (io) {
        const matchDetails = {
          message: message || null,
          created_at: newClaim.created_at,
        };
        emitRealTimeNotification(io, user_id, item_id, matchDetails);
      }
    } catch (e) {
      // non-fatal
    }

    res.status(201).json({
      message: "Claim request created successfully",
      claim: newClaim,
      claimant_message: message || null,
      suggestion: claimantSuggestion,
    });
  } catch (error) {
    console.error("❌ Error creating claim:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route GET /api/claims/user/:user_id
 * @desc Fetch all claims for a specific user
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM claims WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching claims:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route GET /api/claims/security/all
 * @desc Fetch all claim requests for the security dashboard
 */
router.get("/security/all", async (req, res) => {
  try {
    await ensureClaimMessageColumn();

    const result = await pool.query(`
      SELECT 
        c.id AS claim_id,
        c.status,
        c.created_at,
        c.claimant_message,
        u.full_name AS claimant_name,
        u.email AS claimant_email,
        i.id AS item_id,
        i.type AS item_type,
        i.category AS item_category,
        i.image_url AS item_image,
        n.id AS notification_id
      FROM claims c
      JOIN users u ON c.user_id = u.id
      JOIN items i ON c.item_id = i.id
      JOIN notifications n ON c.notification_id = n.id
      ORDER BY c.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching claims for security dashboard:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route GET /api/claims/item/:item_id
 * @desc Fetch all claims related to a specific item (for claim modal)
 */
router.get("/item/:item_id", async (req, res) => {
  try {
    await ensureClaimMessageColumn();

    const { item_id } = req.params;
    console.log(
      `[claims] GET /api/claims/item/${item_id} - incoming from ${
        req.ip || req.headers["x-forwarded-for"] || "unknown"
      }`
    );

    const relatedIds = new Set([item_id]);

    try {
      const matchRes = await pool.query(
        `SELECT lost_item_id, found_item_id
         FROM matches
         WHERE lost_item_id = $1 OR found_item_id = $1`,
        [item_id]
      );

      for (const row of matchRes.rows) {
        if (row.lost_item_id) relatedIds.add(row.lost_item_id);
        if (row.found_item_id) relatedIds.add(row.found_item_id);
      }
    } catch (matchErr) {
      console.error(
        "⚠️ Failed to resolve related match IDs for claims lookup:",
        matchErr
      );
    }

    try {
      const notifRes = await pool.query(
        `SELECT 
           n.item_id,
           m.lost_item_id,
           m.found_item_id
         FROM notifications n
         LEFT JOIN matches m ON n.match_id = m.id
         WHERE n.item_id = $1
            OR m.lost_item_id = $1
            OR m.found_item_id = $1`,
        [item_id]
      );

      for (const row of notifRes.rows) {
        if (row.item_id) relatedIds.add(row.item_id);
        if (row.lost_item_id) relatedIds.add(row.lost_item_id);
        if (row.found_item_id) relatedIds.add(row.found_item_id);
      }
    } catch (notifErr) {
      console.error(
        "⚠️ Failed to resolve related notification IDs for claims lookup:",
        notifErr
      );
    }

    const relatedArray = Array.from(relatedIds).filter(
      (id) => typeof id === "string" && id.trim() !== ""
    );

    if (relatedArray.length === 0) {
      console.warn(
        `[claims] No related item IDs resolved for base item ${item_id}. Returning empty list.`
      );
      return res.status(200).json([]);
    }

    const result = await pool.query(
      `
      SELECT 
        c.id AS claim_id,
        c.status,
        c.created_at,
        c.claimant_message,
        u.full_name AS claimant_name,
        u.email AS claimant_email,
        u.contact_number AS claimant_contact,
        u.department AS claimant_department,
        c.item_id AS claimed_item_id,
        n.item_id AS notification_item_id,
        CASE
          WHEN m.lost_item_id = c.item_id THEN m.found_item_id
          WHEN m.found_item_id = c.item_id THEN m.lost_item_id
          ELSE NULL
        END AS notification_matched_item_id,
        m.lost_item_id,
        m.found_item_id
      FROM claims c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN notifications n ON c.notification_id = n.id
      LEFT JOIN LATERAL (
        SELECT lost_item_id, found_item_id
        FROM matches
        WHERE c.item_id IN (lost_item_id, found_item_id)
        LIMIT 1
      ) m ON TRUE
      WHERE c.item_id::text = ANY($1::text[])
      ORDER BY c.created_at DESC
      `,
      [relatedArray]
    );

    console.log(
      `[claims] result rows for item ${item_id}: ${result.rows.length}`
    );

    // Return an empty array (200) when there are no claims for the item so
    // the frontend consistently receives a list to render (possibly empty).
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching claims for item:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route POST /api/claims/item/:item_id
 * @desc Convenience: create a claim for a specific item when client has only item_id
 * Body: { user_id, notification_id }
 */
router.post("/item/:item_id", async (req, res) => {
  try {
    await ensureClaimMessageColumn();

    const { item_id } = req.params;
    const { user_id, notification_id, message } = req.body;

    if (!user_id || !notification_id) {
      return res
        .status(400)
        .json({ message: "Missing user_id or notification_id in body" });
    }

    // Prevent duplicate claim by same user for same item
    const relatedForDupCheck = await getRelatedItemIds(item_id);
    const sanitizedDupCheck = relatedForDupCheck.filter((id) =>
      uuidRegex.test(id)
    );

    let existingClaimRow = null;
    if (sanitizedDupCheck.length > 0) {
      const existing = await pool.query(
        `SELECT * FROM claims
         WHERE user_id = $1 AND item_id = ANY($2::uuid[])
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_id, sanitizedDupCheck]
      );
      existingClaimRow = existing.rows[0] || null;
    } else {
      console.warn(
        `[claims] Duplicate prevention fallback – using direct item check for ${item_id}`
      );
      const fallbackExisting = await pool.query(
        `SELECT * FROM claims
         WHERE user_id = $1 AND item_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_id, item_id]
      );
      existingClaimRow = fallbackExisting.rows[0] || null;
    }

    if (existingClaimRow) {
      return res
        .status(200)
        .json({ message: "Claim already exists", claim: existingClaimRow });
    }

    const result = await pool.query(
      `INSERT INTO claims (user_id, item_id, notification_id, claimant_message, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
      [user_id, item_id, notification_id, message || null]
    );

    // Update item user_claim_status
    await pool.query(
      `UPDATE items SET user_claim_status = 'pending_claim', updated_at = NOW() WHERE id = $1`,
      [item_id]
    );

    const newClaim = result.rows[0];
    console.log(
      `[claims] New claim (item-route) created: id=${newClaim.id}, user_id=${user_id}, item_id=${item_id}`
    );

    // Insert a notification for the claimant to keep them informed
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, item_id, category, type)
           VALUES ($1, $2, $3, $4)`,
        [user_id, item_id, "general", "claim_submitted"]
      );
    } catch (notifErr) {
      console.error(
        "❌ Failed to insert claimant notification (item route):",
        notifErr
      );
    }

    const claimantSuggestion =
      "Your claim request was submitted. Please visit the Security Office for verification and to complete the claiming process.";
    // Emit socket event so security can see new claim
    try {
      const io = req.app.get("io");
      if (io) {
        const claimantRes = await pool.query(
          "SELECT id, full_name, email FROM users WHERE id = $1",
          [user_id]
        );
        const itemRes = await pool.query(
          "SELECT id, name FROM items WHERE id = $1",
          [item_id]
        );
        const payload = {
          id: newClaim.id,
          claim_id: newClaim.id,
          item_id,
          item_name: itemRes.rows[0]?.name || null,
          user_id,
          user_name: claimantRes.rows[0]?.full_name || null,
          user_email: claimantRes.rows[0]?.email || null,
          // include optional claimant message (not persisted unless DB has column)
          claimant_message: message || null,
          requested_at: newClaim.created_at,
        };
        io.emit("newClaimRequest", payload);
      }
    } catch (emitErr) {
      console.error("❌ Error emitting newClaimRequest (item route):", emitErr);
    }

    // Return claim plus the message back to caller for UX
    res.status(201).json({
      message: "Claim created",
      claim: newClaim,
      claimant_message: message || null,
      suggestion: claimantSuggestion,
    });
  } catch (error) {
    console.error("❌ Error creating claim via item route:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route PUT /api/claims/:claim_id/approve
 * @desc Approve a claim request
 */
router.put("/:claim_id/approve", async (req, res) => {
  try {
    await ensureClaimMessageColumn();
    const { claim_id } = req.params;

    const result = await pool.query(
      `UPDATE claims SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [claim_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const claim = result.rows[0];

    // Sync item's user_claim_status
    await pool.query(
      `UPDATE items SET user_claim_status = 'confirmed_claim', updated_at = NOW() WHERE id = $1`,
      [claim.item_id]
    );

    res.status(200).json({ message: "Claim approved", claim });
  } catch (error) {
    console.error("❌ Error approving claim:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route PUT /api/claims/:claim_id/reject
 * @desc Reject a claim request
 */
router.put("/:claim_id/reject", async (req, res) => {
  try {
    await ensureClaimMessageColumn();
    const { claim_id } = req.params;

    const result = await pool.query(
      `UPDATE claims SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [claim_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const claim = result.rows[0];

    // Sync item's user_claim_status
    await pool.query(
      `UPDATE items SET user_claim_status = 'rejected_claim', updated_at = NOW() WHERE id = $1`,
      [claim.item_id]
    );

    res.status(200).json({ message: "Claim rejected", claim });
  } catch (error) {
    console.error("❌ Error rejecting claim:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route GET /api/claims/pending/count
 * @desc Get number of pending claims for dashboard badge
 */
router.get("/pending/count", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS pending_count FROM claims WHERE status = 'pending'`
    );

    res
      .status(200)
      .json({ pending_count: parseInt(result.rows[0].pending_count) });
  } catch (error) {
    console.error("❌ Error fetching pending claims count:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
