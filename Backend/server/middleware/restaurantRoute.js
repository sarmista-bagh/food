import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   CREATE RESTAURANT
========================= */
router.post(
    "/",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const { name, address } = req.body;

            if (!name || !address) {
                return res.status(400).json({ message: "Name and address required" });
            }

            const owner_id = req.user.id;

            const result = await pool.query(
                `INSERT INTO restaurants (name, address, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [name, address, owner_id]
            );

            res.status(201).json(result.rows[0]);

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

/* =========================
   GET ALL RESTAURANTS
========================= */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM restaurants ORDER BY id DESC"
        );

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   GET SINGLE RESTAURANT
========================= */
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM restaurants WHERE id = $1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   UPDATE RESTAURANT (OWNER ONLY)
========================= */
router.put(
    "/:id",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const { name, address } = req.body;

            const result = await pool.query(
                `UPDATE restaurants
         SET name = $1,
             address = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND owner_id = $4
         RETURNING *`,
                [name, address, req.params.id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    message: "Not allowed or restaurant not found"
                });
            }

            res.json(result.rows[0]);

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

/* =========================
   DELETE RESTAURANT (SUPERADMIN ONLY)
========================= */
router.delete(
    "/:id",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                "DELETE FROM restaurants WHERE id = $1 RETURNING *",
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Restaurant not found" });
            }

            res.json({ message: "Restaurant deleted successfully" });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

export default router;