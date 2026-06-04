import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   PLACE ORDER (CUSTOMER)
========================= */
router.post(
    "/order",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {
            const user_id = req.user.id;

            // 1. GET CART ITEMS
            const cart = await pool.query(
                `SELECT c.menu_item_id, c.quantity, m.price, m.restaurant_id
         FROM cart c
         JOIN menu_items m ON c.menu_item_id = m.id
         WHERE c.user_id = $1`,
                [user_id]
            );

            if (cart.rows.length === 0) {
                return res.status(400).json({
                    message: "Cart is empty"
                });
            }

            const restaurant_id = cart.rows[0].restaurant_id;

            // 2. CALCULATE TOTAL
            let total_price = 0;

            cart.rows.forEach(item => {
                total_price += item.price * item.quantity;
            });

            // 3. CREATE ORDER
            const order = await pool.query(
                `INSERT INTO orders (user_id, restaurant_id, total_price, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
                [user_id, restaurant_id, total_price]
            );

            const order_id = order.rows[0].id;

            // 4. INSERT ORDER ITEMS
            for (const item of cart.rows) {
                await pool.query(
                    `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
                    [order_id, item.menu_item_id, item.quantity, item.price]
                );
            }

            // 5. CLEAR CART
            await pool.query(
                `DELETE FROM cart WHERE user_id = $1`,
                [user_id]
            );

            // 6. RESPONSE
            res.json({
                message: "Order placed successfully",
                order: order.rows[0]
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

export default router;