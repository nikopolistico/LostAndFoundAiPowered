import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * ✅ GET /api/items
 * Fetch all items (optional filters by type, category, user, or status)
 * Example: /api/items?type=lost&category=Electronics
 */
router.get("/", async (req, res) => {
  const { type, category, user_id, status } = req.query;

  try {
    let query = "SELECT * FROM items WHERE 1=1";
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

/**
 * 🔍 SEARCH ROUTE — Find items in security custody (found items)
 * Examples:
 * - /api/items/search?itemName=Black%20Umbrella  (exact name match, case-insensitive)
 * - /api/items/search?studentId=221-01878       (exact student_id match)
 * Backwards-compatible: /api/items/search?query=wallet (partial match or id detection)
 */
router.get("/search", async (req, res) => {
  const { query, itemName, studentId } = req.query;

  try {
    let sql = `
      SELECT *
      FROM items
      WHERE type = 'found'
      AND status = 'in_security_custody'
    `;
    const params = [];

    // Prefer explicit params: studentId or itemName
    if (studentId) {
      // Exact match for student ID
      params.push(studentId);
      sql += ` AND student_id = $${params.length}`;
    } else if (itemName) {
      // Exact name match, case-insensitive
      params.push(itemName);
      sql += ` AND LOWER(name) = LOWER($${params.length})`;
    } else if (query) {
      // Legacy behavior: detect student ID format or do partial name match
      const isStudentId = /^\d{3}-\d{5}$/.test(query);

      if (isStudentId) {
        params.push(query);
        sql += ` AND student_id = $${params.length}`;
      } else {
        params.push(`%${query}%`);
        sql += ` AND LOWER(name) LIKE LOWER($${params.length})`;
      }
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, params);

    // Normalize matching context coming from the caller.
    const rawSourceId =
      typeof req.query.source_item_id === "string"
        ? req.query.source_item_id.trim()
        : "";
    const rawReporterId =
      typeof req.query.reporter_id === "string"
        ? req.query.reporter_id.trim()
        : "";

    const sourceItemId = rawSourceId || null;
    const reporterId = rawReporterId || null;

    const normalizedQueryRaw =
      typeof query === "string" && query.trim() ? query.trim() : null;
    const normalizedQuery = normalizedQueryRaw
      ? normalizedQueryRaw.toLowerCase()
      : null;
    const normalizedStudentFilter =
      typeof studentId === "string" && studentId.trim()
        ? studentId.trim().toLowerCase()
        : normalizedQuery && /^\d{3}-\d{5}$/.test(normalizedQuery)
        ? normalizedQuery
        : null;
    const normalizedNameFilter =
      typeof itemName === "string" && itemName.trim()
        ? itemName.trim().toLowerCase()
        : !normalizedStudentFilter && normalizedQuery
        ? normalizedQuery
        : null;

    // Gather the set of candidate "lost" items that belong to the reporter so we can
    // automatically pair them with any found items returned by this search.
    const candidateLostItems = new Map();
    const notificationDiagnostics = [];

    const searchDebug = {
      reporterId,
      sourceItemId,
      query,
      itemName,
      studentId,
      normalizedQuery,
      normalizedNameFilter,
      normalizedStudentFilter,
      foundCount: Array.isArray(result.rows) ? result.rows.length : 0,
    };

    if (sourceItemId) {
      try {
        const sourceLookup = await pool.query(
          `SELECT id, reporter_id, category, name, student_id
           FROM items
           WHERE id = $1`,
          [sourceItemId]
        );

        if (sourceLookup.rows.length > 0) {
          candidateLostItems.set(sourceItemId, sourceLookup.rows[0]);
        } else if (reporterId) {
          // Fall back to minimal metadata so we can still attempt a match insert.
          candidateLostItems.set(sourceItemId, {
            id: sourceItemId,
            reporter_id: reporterId,
            category: null,
            name: null,
            student_id: null,
          });
        }
      } catch (err) {
        console.error(
          "⚠️ Failed to load source item for match generation:",
          err
        );
        if (reporterId) {
          candidateLostItems.set(sourceItemId, {
            id: sourceItemId,
            reporter_id: reporterId,
            category: null,
            name: null,
            student_id: null,
          });
        }
      }
    }

    if (reporterId) {
      try {
        const reporterLostItems = await pool.query(
          `SELECT id, reporter_id, category, name, student_id
           FROM items
           WHERE reporter_id = $1
             AND type = 'lost'`,
          [reporterId]
        );

        for (const lostItem of reporterLostItems.rows) {
          if (!candidateLostItems.has(lostItem.id)) {
            candidateLostItems.set(lostItem.id, lostItem);
          } else {
            // Prefer the richer row pulled from the database.
            candidateLostItems.set(lostItem.id, {
              ...candidateLostItems.get(lostItem.id),
              ...lostItem,
            });
          }
        }
      } catch (err) {
        console.error(
          "⚠️ Failed to load reporter lost items for matching:",
          err
        );
      }
    }

    console.warn("🔎 Search match candidate load", {
      ...searchDebug,
      candidateLostCount: candidateLostItems.size,
    });

    if (
      candidateLostItems.size === 0 &&
      normalizedNameFilter &&
      normalizedNameFilter.length >= 2
    ) {
      try {
        const fallbackLostItems = await pool.query(
          `SELECT id, reporter_id, category, name, student_id
           FROM items
           WHERE type = 'lost'
             AND LOWER(name) = $1`,
          [normalizedNameFilter]
        );

        for (const lostItem of fallbackLostItems.rows) {
          if (!lostItem?.id) continue;
          const merged = candidateLostItems.get(lostItem.id) || {};
          candidateLostItems.set(lostItem.id, { ...merged, ...lostItem });
        }

        if (fallbackLostItems.rows.length === 0) {
          notificationDiagnostics.push({
            type: "fallback_candidate_none",
            reason: "no_lost_items_for_name",
            searchName: normalizedNameFilter,
          });
        }
      } catch (fallbackLoadErr) {
        console.error(
          "⚠️ Failed to load fallback lost items for search match:",
          fallbackLoadErr
        );
        notificationDiagnostics.push({
          type: "fallback_candidate_error",
          message: fallbackLoadErr?.message || String(fallbackLoadErr),
          searchName: normalizedNameFilter,
        });
      }
    }

    if (candidateLostItems.size === 0) {
      const studentLookupKey =
        normalizedStudentFilter && normalizedStudentFilter.length >= 2
          ? normalizedStudentFilter
          : normalizedQueryRaw && /^\d{3}-\d{5}$/i.test(normalizedQueryRaw)
          ? normalizedQueryRaw
          : null;

      if (studentLookupKey) {
        try {
          const studentLookupCompact = studentLookupKey.replace(/[^0-9]/g, "");
          const fallbackByStudent = await pool.query(
            `SELECT id, reporter_id, category, name, student_id
             FROM items
             WHERE type = 'lost'
               AND (
                 TRIM(LOWER(student_id)) = $1
                 OR REGEXP_REPLACE(student_id, '[^0-9]', '', 'g') = $2
               )`,
            [studentLookupKey.toLowerCase().trim(), studentLookupCompact]
          );

          console.log("🔁 Fallback lost lookup by student", {
            studentLookupKey,
            studentLookupCompact,
            matchedCount: fallbackByStudent.rows.length,
          });

          if (fallbackByStudent.rows.length === 0) {
            const debugLostItems = await pool.query(
              `SELECT id, type, student_id, reporter_id
               FROM items
               WHERE TRIM(LOWER(student_id)) = $1
                  OR REGEXP_REPLACE(student_id, '[^0-9]', '', 'g') = $2
               ORDER BY created_at DESC
               LIMIT 5`,
              [studentLookupKey.toLowerCase().trim(), studentLookupCompact]
            );

            console.log("🔧 Student lookup debug", {
              studentLookupKey,
              studentLookupCompact,
              sample: debugLostItems.rows,
            });
          }

          for (const lostItem of fallbackByStudent.rows) {
            if (!lostItem?.id) continue;
            const merged = candidateLostItems.get(lostItem.id) || {};
            candidateLostItems.set(lostItem.id, { ...merged, ...lostItem });
          }

          if (fallbackByStudent.rows.length === 0) {
            notificationDiagnostics.push({
              type: "fallback_candidate_none",
              reason: "no_lost_items_for_student",
              searchStudent: studentLookupKey,
            });
          }
        } catch (fallbackStudentErr) {
          console.error(
            "⚠️ Failed to load fallback lost items by student ID:",
            fallbackStudentErr
          );
          notificationDiagnostics.push({
            type: "fallback_candidate_error",
            message: fallbackStudentErr?.message || String(fallbackStudentErr),
            searchStudent: studentLookupKey,
          });
        }
      }
    }

    if (candidateLostItems.size === 0) {
      console.warn("⚠️ Search match pipeline has zero candidate lost items.", {
        reporterId,
        sourceItemId,
        normalizedNameFilter,
        normalizedStudentFilter,
        normalizedQuery,
        searchParams: { query, itemName, studentId },
        foundCount: Array.isArray(result.rows) ? result.rows.length : 0,
      });
    }

    let successfulNotification = false;

    if (
      candidateLostItems.size > 0 &&
      Array.isArray(result.rows) &&
      result.rows.length > 0
    ) {
      const io = req.app.get("io");

      for (const foundItem of result.rows) {
        const foundId = foundItem.id;
        const foundStudent =
          typeof foundItem.student_id === "string" &&
          foundItem.student_id.trim()
            ? foundItem.student_id.trim().toLowerCase()
            : null;
        const foundName =
          typeof foundItem.name === "string" && foundItem.name.trim()
            ? foundItem.name.trim().toLowerCase()
            : null;
        const foundCategory =
          typeof foundItem.category === "string" && foundItem.category.trim()
            ? foundItem.category.trim().toLowerCase()
            : null;

        for (const [lostId, lostItem] of candidateLostItems.entries()) {
          if (!lostId) {
            console.error(
              "❌ Skipping match attempt due to missing lost item id.",
              {
                ...searchDebug,
                foundId,
                lostItem,
              }
            );
            continue;
          }

          if (!foundId) {
            console.error(
              "❌ Skipping match attempt due to missing found item id.",
              {
                ...searchDebug,
                lostId,
                foundItem,
              }
            );
            continue;
          }

          if (foundId === lostId) {
            console.log("⏭️ Skipping identical lost/found ids", {
              ...searchDebug,
              lostId,
              foundId,
            });
            continue;
          }

          const lostStudent =
            typeof lostItem?.student_id === "string" &&
            lostItem.student_id.trim()
              ? lostItem.student_id.trim().toLowerCase()
              : null;
          const lostName =
            typeof lostItem?.name === "string" && lostItem.name.trim()
              ? lostItem.name.trim().toLowerCase()
              : null;
          const lostCategory =
            typeof lostItem?.category === "string" && lostItem.category.trim()
              ? lostItem.category.trim().toLowerCase()
              : null;

          const studentMatches =
            (normalizedStudentFilter &&
              lostStudent &&
              lostStudent === normalizedStudentFilter) ||
            (foundStudent && lostStudent && foundStudent === lostStudent);

          const nameMatches =
            (normalizedNameFilter &&
              lostName &&
              lostName === normalizedNameFilter) ||
            (foundName && lostName && foundName === lostName);

          if (!studentMatches && !nameMatches) {
            console.log("⏭️ No student or name match", {
              ...searchDebug,
              lostId,
              foundId,
              foundStudent,
              lostStudent,
              foundName,
              lostName,
            });
            continue;
          }

          if (foundCategory && lostCategory && foundCategory !== lostCategory) {
            console.log("⏭️ Category mismatch", {
              ...searchDebug,
              lostId,
              foundId,
              foundCategory,
              lostCategory,
            });
            continue;
          }

          const existingMatch = await pool.query(
            `SELECT id
             FROM matches
             WHERE (lost_item_id = $1 AND found_item_id = $2)
                OR (lost_item_id = $2 AND found_item_id = $1)
             LIMIT 1`,
            [lostId, foundId]
          );

          const notificationUserId = lostItem?.reporter_id || reporterId;
          const categoryForNotification =
            lostItem?.category || foundItem.category || null;

          const ensureNotificationForMatch = async (matchId) => {
            if (!matchId) {
              notificationDiagnostics.push({
                type: "skipped",
                reason: "missing_match_id",
                lostId,
                foundId,
              });
              return;
            }

            if (!notificationUserId) {
              notificationDiagnostics.push({
                type: "skipped",
                reason: "missing_notification_user",
                matchId,
                lostId,
                foundId,
              });
              return;
            }
            try {
              const existingNotification = await pool.query(
                `SELECT 1 FROM notifications
                 WHERE match_id = $1 AND user_id = $2
                 LIMIT 1`,
                [matchId, notificationUserId]
              );
              if (existingNotification.rows.length === 0) {
                await pool.query(
                  `INSERT INTO notifications (user_id, item_id, match_id, category, type)
                   VALUES ($1, $2, $3, $4, $5)`,
                  [
                    notificationUserId,
                    lostId,
                    matchId,
                    categoryForNotification,
                    "match_found",
                  ]
                );

                if (io) {
                  io.emit("newNotification", {
                    user_id: notificationUserId,
                    item_id: lostId,
                    match_id: matchId,
                    category: categoryForNotification,
                    type: "match_found",
                  });
                }

                notificationDiagnostics.push({
                  type: "inserted",
                  matchId,
                  lostId,
                  foundId,
                });
                successfulNotification = true;
              } else {
                notificationDiagnostics.push({
                  type: "existing",
                  matchId,
                  lostId,
                  foundId,
                });
                successfulNotification = true;
              }
            } catch (notifErr) {
              console.error(
                "⚠️ Failed to upsert notification for match:",
                notifErr
              );
              notificationDiagnostics.push({
                type: "error",
                matchId,
                lostId,
                foundId,
                message: notifErr?.message || String(notifErr),
              });
            }
          };

          if (existingMatch.rows.length > 0) {
            console.log("ℹ️ Match already exists", {
              ...searchDebug,
              lostId,
              foundId,
              matchId: existingMatch.rows[0].id,
            });
            await ensureNotificationForMatch(existingMatch.rows[0].id);
            continue;
          }

          try {
            const matchInsert = await pool.query(
              `INSERT INTO matches (lost_item_id, found_item_id, confidence, created_at)
               VALUES ($1::uuid, $2::uuid, $3::numeric(5,2), NOW())
               RETURNING id`,
              [lostId, foundId, 100.0]
            );

            const matchId = matchInsert.rows[0].id;
            await ensureNotificationForMatch(matchId);

            console.log(
              `💾 Search-created match ${matchId} between lost ${lostId} and found ${foundId}`
            );
          } catch (insertErr) {
            console.error("❌ Error inserting match from search:", {
              ...searchDebug,
              lostId,
              foundId,
              lostItem,
              foundItem,
              error: insertErr?.message || insertErr,
            });
            notificationDiagnostics.push({
              type: "match_insert_error",
              lostId,
              foundId,
              message: insertErr?.message || String(insertErr),
            });
          }
        }
      }

      if (!successfulNotification) {
        const fallbackFound = result.rows[0] || null;
        const fallbackEntry = candidateLostItems.entries().next().value;

        if (fallbackFound && Array.isArray(fallbackEntry)) {
          const [fallbackLostId, fallbackLost] = fallbackEntry;

          try {
            const fallbackExisting = await pool.query(
              `SELECT id
               FROM matches
               WHERE (lost_item_id = $1 AND found_item_id = $2)
                  OR (lost_item_id = $2 AND found_item_id = $1)
               LIMIT 1`,
              [fallbackLostId, fallbackFound.id]
            );

            let fallbackMatchId = fallbackExisting.rows[0]?.id || null;

            if (!fallbackMatchId) {
              const inserted = await pool.query(
                `INSERT INTO matches (lost_item_id, found_item_id, confidence, created_at)
                 VALUES ($1::uuid, $2::uuid, $3::numeric(5,2), NOW())
                 RETURNING id`,
                [fallbackLostId, fallbackFound.id, 75.0]
              );
              fallbackMatchId = inserted.rows[0]?.id || null;

              notificationDiagnostics.push({
                type: "fallback_match_inserted",
                lostId: fallbackLostId,
                foundId: fallbackFound.id,
                matchId: fallbackMatchId,
              });
            } else {
              notificationDiagnostics.push({
                type: "fallback_match_existing",
                lostId: fallbackLostId,
                foundId: fallbackFound.id,
                matchId: fallbackMatchId,
              });
            }

            if (fallbackMatchId) {
              const fallbackUserId =
                fallbackLost?.reporter_id || reporterId || null;
              const fallbackCategory =
                fallbackLost?.category || fallbackFound.category || null;

              if (!fallbackUserId) {
                notificationDiagnostics.push({
                  type: "fallback_notification_skipped",
                  reason: "missing_user",
                  matchId: fallbackMatchId,
                  lostId: fallbackLostId,
                  foundId: fallbackFound.id,
                });
              } else {
                try {
                  const existingNotification = await pool.query(
                    `SELECT 1 FROM notifications
                     WHERE match_id = $1 AND user_id = $2
                     LIMIT 1`,
                    [fallbackMatchId, fallbackUserId]
                  );

                  if (existingNotification.rows.length === 0) {
                    await pool.query(
                      `INSERT INTO notifications (user_id, item_id, match_id, category, type)
                       VALUES ($1, $2, $3, $4, $5)`,
                      [
                        fallbackUserId,
                        fallbackLostId,
                        fallbackMatchId,
                        fallbackCategory,
                        "match_found",
                      ]
                    );

                    const ioForFallback = io || req.app.get("io");
                    if (ioForFallback) {
                      ioForFallback.emit("newNotification", {
                        user_id: fallbackUserId,
                        item_id: fallbackLostId,
                        match_id: fallbackMatchId,
                        category: fallbackCategory,
                        type: "match_found",
                      });
                    }

                    successfulNotification = true;
                    notificationDiagnostics.push({
                      type: "fallback_notification_inserted",
                      matchId: fallbackMatchId,
                      lostId: fallbackLostId,
                      foundId: fallbackFound.id,
                    });
                  } else {
                    successfulNotification = true;
                    notificationDiagnostics.push({
                      type: "fallback_notification_existing",
                      matchId: fallbackMatchId,
                      lostId: fallbackLostId,
                      foundId: fallbackFound.id,
                    });
                  }
                } catch (notifErr) {
                  console.error(
                    "❌ Failed to insert fallback notification:",
                    notifErr
                  );
                  notificationDiagnostics.push({
                    type: "fallback_notification_error",
                    matchId: fallbackMatchId,
                    lostId: fallbackLostId,
                    foundId: fallbackFound.id,
                    message: notifErr?.message || String(notifErr),
                  });
                }
              }
            }
          } catch (fallbackErr) {
            console.error("❌ Fallback match creation failed:", fallbackErr);
            notificationDiagnostics.push({
              type: "fallback_error",
              lostId: fallbackLostId,
              foundId: fallbackFound.id,
              message: fallbackErr?.message || String(fallbackErr),
            });
          }
        }
      }
    }

    if (notificationDiagnostics.length > 0) {
      console.warn(
        "🔍 Notification diagnostics after search:",
        notificationDiagnostics
      );

      try {
        const diagnosticsPreview = JSON.stringify(
          notificationDiagnostics.slice(0, 20)
        );
        res.set("X-Notification-Diagnostics", diagnosticsPreview);
      } catch (headerErr) {
        console.error(
          "⚠️ Failed to serialize notification diagnostics header:",
          headerErr
        );
      }
    }

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error searching items:", err);
    res.status(500).json({ error: "Failed to search items" });
  }
});

/**
 * ✅ GET /api/items/:id
 * Fetch a single item by ID
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching item:", err);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

/**
 * ✅ POST /api/items
 * Add a new item (admin/manual insert)
 */
router.post("/", async (req, res) => {
  const {
    user_id,
    name,
    description,
    category,
    brand,
    color,
    location,
    type, // 'lost' or 'found'
    image_url,
    student_id,
    department,
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO items (
        user_id, name, description, category, brand, color, location, type, image_url, student_id, department, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        CASE WHEN $8 = 'found' THEN 'in_security_custody' ELSE 'reported_lost' END
      )
      RETURNING *;
      `,
      [
        user_id,
        name,
        description,
        category,
        brand,
        color,
        location,
        type,
        image_url,
        student_id,
        department,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding item:", err);
    res.status(500).json({ error: "Failed to add item" });
  }
});

/**
 * ✅ PUT /api/items/:id
 * Update item details (e.g., status = 'claimed', 'resolved', etc.)
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    brand,
    color,
    location,
    status,
    type,
    image_url,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE items
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        brand = COALESCE($4, brand),
        color = COALESCE($5, color),
        location = COALESCE($6, location),
        status = COALESCE($7, status),
        type = COALESCE($8, type),
        image_url = COALESCE($9, image_url),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *;
      `,
      [
        name,
        description,
        category,
        brand,
        color,
        location,
        status,
        type,
        image_url,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item updated successfully", item: result.rows[0] });
  } catch (err) {
    console.error("❌ Error updating item:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

/**
 * ✅ DELETE /api/items/:id
 * Delete an item (admin or item owner only)
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({
      message: "Item deleted successfully",
      deletedItem: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting item:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
