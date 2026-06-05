// import express from "express";
// import pool from "../config/db.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { authorizeRoles } from "../middleware/roleMiddleware.js";

// const router = express.Router();

// /* =========================
//    ADD FOOD ITEM (RESTAURANT ONLY)
// ========================= */
// router.post(
//     "/",
//     protect,
//     authorizeRoles("restaurant"),
//     async (req, res) => {
//         try {
//             const { name, description, price } = req.body;

//             // ✅ validation
//             if (!name || !price) {
//                 return res.status(400).json({
//                     message: "Name and price are required",
//                 });
//             }

//             // 🔐 ALWAYS GET RESTAURANT FROM OWNER (NOT FRONTEND)
//             const restaurant = await pool.query(
//                 "SELECT id FROM restaurants WHERE owner_id = $1",
//                 [req.user.id]
//             );

//             if (restaurant.rows.length === 0) {
//                 return res.status(403).json({
//                     message: "No restaurant found for this user",
//                 });
//             }

//             const restaurant_id = restaurant.rows[0].id;

//             // ✅ insert menu item
//             const result = await pool.query(
//                 `INSERT INTO menu_items (restaurant_id, name, description, price)
//          VALUES ($1, $2, $3, $4)
//          RETURNING *`,
//                 [restaurant_id, name, description, price]
//             );

//             res.status(201).json({
//                 message: "Food item added successfully",
//                 item: result.rows[0],
//             });

//         } catch (error) {
//             console.log(error);
//             res.status(500).json({ message: "Server error" });
//         }
//     }
// );

// export default router;



// import express from "express";
// import pool from "../config/db.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { authorizeRoles } from "../middleware/roleMiddleware.js";

// const router = express.Router();

// /* =========================
//    ADD FOOD ITEM
// ========================= */
// router.post(
//     "/",
//     protect,
//     authorizeRoles("restaurant"),
//     async (req, res) => {
//         try {
//             const { name, description, price } = req.body;

//             if (!name || !price) {
//                 return res.status(400).json({
//                     message: "Name and price are required",
//                 });
//             }

//             const restaurant = await pool.query(
//                 "SELECT id FROM restaurants WHERE owner_id = $1",
//                 [req.user.id]
//             );

//             if (restaurant.rows.length === 0) {
//                 return res.status(403).json({
//                     message: "No restaurant found for this user",
//                 });
//             }

//             const restaurant_id = restaurant.rows[0].id;

//             const result = await pool.query(
//                 `INSERT INTO menu_items (restaurant_id, name, description, price)
//                  VALUES ($1, $2, $3, $4)
//                  RETURNING *`,
//                 [restaurant_id, name, description, price]
//             );

//             res.status(201).json({
//                 message: "Food item added successfully",
//                 item: result.rows[0],
//             });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({
//                 message: "Server error",
//             });
//         }
//     }
// );

// /* =========================
//    GET ALL MENU ITEMS
// ========================= */
// router.get("/", async (req, res) => {
//     try {
//         const result = await pool.query(`
//             SELECT *
//             FROM menu_items
//             ORDER BY id DESC
//         `);

//         res.json(result.rows);

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Server error",
//         });
//     }
// });

// export default router;



import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   ADD FOOD ITEM
========================= */
router.post(
    "/",
    protect,
    authorizeRoles("restaurant"),
    async (req, res) => {
        try {
            const { name, description, price } = req.body;

            if (!name || !price) {
                return res.status(400).json({
                    message: "Name and price are required",
                });
            }

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
            console.error(error);
            res.status(500).json({
                message: "Server error",
            });
        }
    }
);

/* =========================
   GET ALL MENU ITEMS
========================= */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM menu_items ORDER BY id DESC"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
});

/* =========================
   GET MENU BY RESTAURANT ID
========================= */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const restaurantResult = await pool.query(
            "SELECT * FROM restaurants WHERE id = $1",
            [id]
        );

        if (restaurantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Restaurant not found",
            });
        }

        const menuResult = await pool.query(
            "SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id DESC",
            [id]
        );

        res.status(200).json({
            restaurant: restaurantResult.rows[0],
            items: menuResult.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
});

export default router;