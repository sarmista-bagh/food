import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();


// ===============================
// SUPERADMIN DASHBOARD STATS
// ===============================
router.get(
    "/dashboard",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const users = await pool.query("SELECT COUNT(*) FROM users");

            const restaurants = await pool.query("SELECT COUNT(*) FROM restaurants");

            const orders = await pool.query("SELECT COUNT(*) FROM orders");

            const revenue = await pool.query(
                "SELECT COALESCE(SUM(total_price),0) as revenue FROM orders"
            );

            const pendingOrders = await pool.query(
                "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
            );

            const deliveredOrders = await pool.query(
                "SELECT COUNT(*) FROM orders WHERE status = 'delivered'"
            );

            res.json({
                users: users.rows[0].count,
                restaurants: restaurants.rows[0].count,
                orders: orders.rows[0].count,
                revenue: revenue.rows[0].revenue,
                pending: pendingOrders.rows[0].count,
                delivered: deliveredOrders.rows[0].count,
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// ===============================
// GET ALL USERS (SUPERADMIN)
// ===============================
router.get(
    "/users",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
            );

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// ===============================
// GET ALL RESTAURANTS (SUPERADMIN)
// ===============================
router.get(
    "/restaurants",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT * FROM restaurants ORDER BY id DESC"
            );

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// ===============================
// TOGGLE RESTAURANT STATUS
// ===============================
router.patch(
    "/restaurants/:id/toggle",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                `
        UPDATE restaurants
        SET is_active = NOT COALESCE(is_active, true),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
                [req.params.id]
            );

            res.json({
                message: "Restaurant status updated",
                data: result.rows[0],
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// ===============================
// GET ALL ORDERS (SUPERADMIN)
// ===============================
router.get(
    "/orders",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT o.*, u.name as user_name, r.name as restaurant_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN restaurants r ON o.restaurant_id = r.id
        ORDER BY o.id DESC
      `);

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);


// ===============================
// REVENUE REPORT (SUPERADMIN)
// ===============================
router.get(
    "/revenue",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT DATE(created_at) as date,
               SUM(total_price) as revenue
        FROM orders
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

export default router;