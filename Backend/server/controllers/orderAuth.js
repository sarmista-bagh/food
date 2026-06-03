// import express from "express";
// import pool from "../config/db.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { authorizeRoles } from "../middleware/roleMiddleware.js";

// const router = express.Router();

// /* =========================================
//    CREATE ORDER (CUSTOMER ONLY)
// ========================================= */
// router.post(
//     "/",
//     protect,
//     authorizeRoles("customer"),
//     async (req, res) => {
//         const client = await pool.connect();

//         try {
//             const { restaurant_id, items } = req.body;

//             if (!items || items.length === 0) {
//                 return res.status(400).json({ message: "Cart is empty" });
//             }

//             await client.query("BEGIN");

//             /* ---------------- VALIDATE RESTAURANT ---------------- */
//             const restaurant = await client.query(
//                 "SELECT id FROM restaurants WHERE id=$1",
//                 [restaurant_id]
//             );

//             if (restaurant.rows.length === 0) {
//                 return res.status(404).json({ message: "Restaurant not found" });
//             }

//             let total_amount = 0;

//             /* ---------------- VALIDATE ITEMS + PRICE FROM DB ---------------- */
//             for (let item of items) {
//                 const food = await client.query(
//                     "SELECT price FROM menu_items WHERE id=$1",
//                     [item.menu_item_id]
//                 );

//                 if (food.rows.length === 0) {
//                     throw new Error(`Invalid menu item: ${item.menu_item_id}`);
//                 }

//                 const price = food.rows[0].price;

//                 total_amount += price * item.quantity;

//                 // override frontend price (security)
//                 item.price = price;
//             }

//             /* ---------------- CREATE ORDER ---------------- */
//             const orderResult = await client.query(
//                 `INSERT INTO orders (user_id, restaurant_id, total_price, status)
//          VALUES ($1,$2,$3,'pending')
//          RETURNING *`,
//                 [req.user.id, restaurant_id, total_amount]
//             );

//             const orderId = orderResult.rows[0].id;

//             /* ---------------- INSERT ORDER ITEMS ---------------- */
//             for (let item of items) {
//                 await client.query(
//                     `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
//            VALUES ($1,$2,$3,$4)`,
//                     [orderId, item.menu_item_id, item.quantity, item.price]
//                 );
//             }

//             /* ---------------- COMMIT ---------------- */
//             await client.query("COMMIT");

//             res.json({
//                 success: true,
//                 message: "Order placed successfully 🚀",
//                 orderId
//             });

//         } catch (error) {
//             await client.query("ROLLBACK");
//             console.log("ORDER ERROR:", error.message);

//             res.status(500).json({
//                 success: false,
//                 message: error.message
//             });

//         } finally {
//             client.release();
//         }
//     }
// );

// export default router;