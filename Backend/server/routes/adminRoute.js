import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();


// DASHBOARD STATS
//========================= 
router.get(
  "/dashboard",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const users = await pool.query(`SELECT COUNT(*) FROM users`);
      const restaurants = await pool.query(`SELECT COUNT(*) FROM restaurants`);
      const orders = await pool.query(`SELECT COUNT(*) FROM orders`);

      const revenue = await pool.query(`
        SELECT COALESCE(SUM(total_price),0) AS total
        FROM orders WHERE status='delivered'
      `);

      const pending = await pool.query(`
        SELECT COUNT(*) FROM orders WHERE status='pending'
      `);

      const delivered = await pool.query(`
        SELECT COUNT(*) FROM orders WHERE status='delivered'
      `);

      res.json({
        users: Number(users.rows[0].count),
        restaurants: Number(restaurants.rows[0].count),
        orders: Number(orders.rows[0].count),
        revenue: Number(revenue.rows[0].total),
        pending: Number(pending.rows[0].count),
        delivered: Number(delivered.rows[0].count),
      });

    } catch (err) {
      console.log("Dashboard error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// DAILY ANALYTICS
//========================= 
router.get(
  "/analytics/daily",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          DATE(created_at) AS date,
          COUNT(*) FILTER (WHERE status='pending') AS pending,
          COUNT(*) FILTER (WHERE status='delivered') AS delivered,
          COALESCE(SUM(total_price) FILTER (WHERE status='delivered'),0) AS revenue
        FROM orders
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      res.json(result.rows);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


//MONTHLY ANALYTICS
//========================= 
router.get(
  "/analytics/monthly",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          TO_CHAR(created_at,'YYYY-MM') AS month,
          COUNT(*) FILTER (WHERE status='pending') AS pending,
          COUNT(*) FILTER (WHERE status='delivered') AS delivered,
          COALESCE(SUM(total_price) FILTER (WHERE status='delivered'),0) AS revenue
        FROM orders
        GROUP BY TO_CHAR(created_at,'YYYY-MM')
        ORDER BY month ASC
      `);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


// LIVE ORDERS
//========================= 
router.get(
  "/orders/live",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT o.*, u.name AS user_name
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 20
      `);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


//  USERS LIST
//========================= 
router.get(
  "/users",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id, name, email, role, is_blocked
        FROM users
        ORDER BY id DESC
      `);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


// BLOCK / UNBLOCK USER
//========================= 
router.patch(
  "/users/:id/block",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        UPDATE users
        SET is_blocked = NOT is_blocked
        WHERE id=$1
        RETURNING id,name,email,is_blocked
      `, [req.params.id]);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


// RESTAURANT TOGGLE
//========================= 
router.patch(
  "/restaurants/:id/toggle",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        UPDATE restaurants
        SET is_active = NOT is_active
        WHERE id=$1
        RETURNING *
      `, [req.params.id]);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;