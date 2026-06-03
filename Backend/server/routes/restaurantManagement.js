

import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ======================================================
   DASHBOARD
====================================================== */
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
                "SELECT COALESCE(SUM(total_amount),0) as revenue FROM orders"
            );

            const pending = await pool.query(
                "SELECT COUNT(*) FROM orders WHERE status='pending'"
            );

            const delivered = await pool.query(
                "SELECT COUNT(*) FROM orders WHERE status='delivered'"
            );

            res.json({
                users: users.rows[0].count,
                restaurants: restaurants.rows[0].count,
                orders: orders.rows[0].count,
                revenue: revenue.rows[0].revenue,
                pending: pending.rows[0].count,
                delivered: delivered.rows[0].count,
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* ======================================================
   USERS
====================================================== */
router.get(
    "/users",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT id,name,email,role,is_blocked,created_at FROM users ORDER BY id DESC"
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

router.patch(
    "/users/:id/block",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                `UPDATE users 
         SET is_blocked = NOT is_blocked 
         WHERE id=$1 
         RETURNING id,name,email,is_blocked`,
                [req.params.id]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* ======================================================
   RESTAURANTS CRUD
====================================================== */

// CREATE
router.post(
    "/restaurants",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const {
                name,
                address,
                owner_id,
                image,
                delivery_time = 30,
                rating = 0,
                is_active = true,
            } = req.body;

            const result = await pool.query(
                `INSERT INTO restaurants 
        (name,address,owner_id,image,delivery_time,rating,is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *`,
                [name, address, owner_id, image, delivery_time, rating, is_active]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// READ
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
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// UPDATE
router.put(
    "/restaurants/:id",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const {
                name,
                address,
                image,
                delivery_time,
                rating,
                is_active,
            } = req.body;

            const result = await pool.query(
                `UPDATE restaurants
         SET name=$1,
             address=$2,
             image=$3,
             delivery_time=$4,
             rating=$5,
             is_active=$6,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=$7
         RETURNING *`,
                [
                    name,
                    address,
                    image,
                    delivery_time,
                    rating,
                    is_active,
                    req.params.id,
                ]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// DELETE
router.delete(
    "/restaurants/:id",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            await pool.query("DELETE FROM restaurants WHERE id=$1", [
                req.params.id,
            ]);

            res.json({ message: "Restaurant deleted" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// TOGGLE
router.patch(
    "/restaurants/:id/toggle",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(
                `UPDATE restaurants
         SET is_active = NOT COALESCE(is_active,true),
             updated_at=CURRENT_TIMESTAMP
         WHERE id=$1
         RETURNING *`,
                [req.params.id]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* ======================================================
   FOODS CRUD
====================================================== */

// CREATE
router.post(
    "/foods",
    protect,
    authorizeRoles("superadmin", "restaurant"),
    async (req, res) => {
        try {
            const {
                restaurant_id,
                name,
                price,
                image,
                category,
                description,
            } = req.body;

            const result = await pool.query(
                `INSERT INTO foods 
        (restaurant_id,name,price,image,category,description)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
                [restaurant_id, name, price, image, category, description]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// READ
router.get("/foods/:restaurant_id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM foods WHERE restaurant_id=$1",
            [req.params.restaurant_id]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE
router.put(
    "/foods/:id",
    protect,
    authorizeRoles("superadmin", "restaurant"),
    async (req, res) => {
        try {
            const {
                name,
                price,
                image,
                category,
                description,
                is_available,
            } = req.body;

            const result = await pool.query(
                `UPDATE foods
         SET name=$1,
             price=$2,
             image=$3,
             category=$4,
             description=$5,
             is_available=$6
         WHERE id=$7
         RETURNING *`,
                [
                    name,
                    price,
                    image,
                    category,
                    description,
                    is_available,
                    req.params.id,
                ]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// DELETE
router.delete(
    "/foods/:id",
    protect,
    authorizeRoles("superadmin", "restaurant"),
    async (req, res) => {
        try {
            await pool.query("DELETE FROM foods WHERE id=$1", [
                req.params.id,
            ]);

            res.json({ message: "Food deleted" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* ======================================================
   ORDERS
====================================================== */
router.get(
    "/orders",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT o.*, u.name as user_name, r.name as restaurant_name
        FROM orders o
        JOIN users u ON o.user_id=u.id
        JOIN restaurants r ON o.restaurant_id=r.id
        ORDER BY o.id DESC
      `);

            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// UPDATE STATUS
router.patch(
    "/orders/:id/status",
    protect,
    authorizeRoles("superadmin", "restaurant"),
    async (req, res) => {
        try {
            const { status } = req.body;

            const result = await pool.query(
                `UPDATE orders 
         SET status=$1,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=$2
         RETURNING *`,
                [status, req.params.id]
            );

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/* ======================================================
   REVENUE (FIXED total_amount)
====================================================== */
router.get(
    "/revenue",
    protect,
    authorizeRoles("superadmin"),
    async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT DATE(created_at) as date,
               SUM(total_amount) as revenue
        FROM orders
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;