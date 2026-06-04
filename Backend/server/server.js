import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import axios from "axios";

import authRoutes from "./routes/authRoutes.js";
import checkoutRoutes from "./routes/checkoutRoute.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/admin", adminRoutes);

/* ==========================================
   ROOT ROUTE
========================================== */
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend running successfully",
    });
});

/* ==========================================
   SWIGGY RESTAURANTS API
========================================== */
app.get("/api/restaurants", async (req, res) => {
    try {
        const response = await axios.get(
            "https://www.swiggy.com/dapi/restaurants/list/v5?lat=12.9351929&lng=77.62448069999999&page_type=DESKTOP_WEB_LISTING"
        );

        res.json(response.data);
    } catch (error) {
        console.error("Swiggy API Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurants",
        });
    }
});

/* ==========================================
   SWIGGY MENU API
========================================== */
app.get("/api/menu/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const response = await axios.get(
            `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=17.3924982&lng=78.46796379999999&restaurantId=${id}&submitAction=ENTER`
        );

        res.json(response.data);
    } catch (error) {
        console.error("Menu API Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu",
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});