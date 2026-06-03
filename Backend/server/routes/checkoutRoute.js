import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ---------------- CHECKOUT (CART → ORDER) ---------------- */
router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {
            const user_id = req.user.id;

            // 1. Get cart items
            const cartResult = await pool.query(
                `SELECT c.menu_item_id, c.quantity, m.price, m.restaurant_id
                 FROM cart c
                 JOIN menu_items m ON c.menu_item_id = m.id
                 WHERE c.user_id = $1`,
                [user_id]
            );

            const cartItems = cartResult.rows;

            if (cartItems.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // 2. Calculate total price
            let total_price = 0;
            const restaurant_id = cartItems[0].restaurant_id;

            cartItems.forEach(item => {
                total_price += item.price * item.quantity;
            });

            // 3. Create order
            const orderResult = await pool.query(
                `INSERT INTO orders (user_id, restaurant_id, total_price)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [user_id, restaurant_id, total_price]
            );

            const order = orderResult.rows[0];

            // 4. Insert order items
            for (let item of cartItems) {
                await pool.query(
                    `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
                     VALUES ($1, $2, $3, $4)`,
                    [order.id, item.menu_item_id, item.quantity, item.price]
                );
            }

            // 5. Clear cart
            await pool.query(
                `DELETE FROM cart WHERE user_id = $1`,
                [user_id]
            );

            return res.status(201).json({
                message: "Order placed successfully 🚀",
                order
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    }
);

export default router;