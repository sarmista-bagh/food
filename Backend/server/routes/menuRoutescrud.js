import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================================
   🔐 OWNER CHECK HELPER
========================================= */
const verifyOwner = async (restaurant_id, user_id) => {
    const result = await pool.query(
        `SELECT 1 FROM restaurants WHERE id=$1 AND owner_id=$2`,
        [restaurant_id, user_id]
    );
    return result.rowCount > 0;
};

/* =========================================
   ➕ ADD FOOD ITEM
========================================= */
router.post(
    "/",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const {
                restaurant_id,
                name,
                description,
                price,
                category,
                image,
            } = req.body;

            if (!restaurant_id || !name || !price) {
                return res.status(400).json({
                    message: "restaurant_id, name, price required",
                });
            }

            const isOwner = await verifyOwner(restaurant_id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ message: "Not your restaurant" });
            }

            const result = await pool.query(
                `INSERT INTO menu_items
        (restaurant_id, name, description, price, category, image)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
                [restaurant_id, name, description, price, category, image]
            );

            res.status(201).json({
                success: true,
                message: "Food item created",
                data: result.rows[0],
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================================
   📋 GET ALL MENU ITEMS (BY RESTAURANT)
========================================= */
router.get("/:restaurant_id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM menu_items
       WHERE restaurant_id=$1
       ORDER BY id DESC`,
            [req.params.restaurant_id]
        );

        res.json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* =========================================
   📋 GET SINGLE ITEM
========================================= */
router.get("/item/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM menu_items WHERE id=$1`,
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* =========================================
   ✏️ UPDATE FOOD ITEM
========================================= */
router.put(
    "/:id",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const {
                name,
                description,
                price,
                category,
                image,
                is_available,
            } = req.body;

            const check = await pool.query(
                `SELECT m.id FROM menu_items m
         JOIN restaurants r ON m.restaurant_id = r.id
         WHERE m.id=$1 AND r.owner_id=$2`,
                [req.params.id, req.user.id]
            );

            if (check.rowCount === 0) {
                return res.status(403).json({ message: "Not allowed" });
            }

            const result = await pool.query(
                `UPDATE menu_items
         SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            price = COALESCE($3, price),
            category = COALESCE($4, category),
            image = COALESCE($5, image),
            is_available = COALESCE($6, is_available),
            updated_at = CURRENT_TIMESTAMP
         WHERE id=$7
         RETURNING *`,
                [name, description, price, category, image, is_available, req.params.id]
            );

            res.json({
                success: true,
                message: "Food updated",
                data: result.rows[0],
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* =========================================
   ❌ DELETE FOOD ITEM
========================================= */
router.delete(
    "/:id",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const check = await pool.query(
                `SELECT m.id FROM menu_items m
         JOIN restaurants r ON m.restaurant_id = r.id
         WHERE m.id=$1 AND r.owner_id=$2`,
                [req.params.id, req.user.id]
            );

            if (check.rowCount === 0) {
                return res.status(403).json({ message: "Not allowed" });
            }

            await pool.query(`DELETE FROM menu_items WHERE id=$1`, [
                req.params.id,
            ]);

            res.json({
                success: true,
                message: "Food deleted successfully",
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;