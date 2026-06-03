import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   ADD FOOD ITEM (RESTAURANT ONLY)
========================= */
router.post(
    "/",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const { name, description, price } = req.body;

            // ✅ validation
            if (!name || !price) {
                return res.status(400).json({
                    message: "Name and price are required",
                });
            }

            // 🔐 ALWAYS GET RESTAURANT FROM OWNER (NOT FRONTEND)
            const restaurant = await pool.query(
                "SELECT id FROM restaurants WHERE owner_id = $1",
                [req.user.id]
            );

            if (restaurant.rows.length === 0) {
                return res.status(403).json({
                    message: "No restaurant found for this user",
                });
            }

            const restaurant_id = restaurant.rows[0].id;

            // ✅ insert menu item
            const result = await pool.query(
                `INSERT INTO menu_items (restaurant_id, name, description, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [restaurant_id, name, description, price]
            );

            res.status(201).json({
                message: "Food item added successfully",
                item: result.rows[0],
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

export default router;