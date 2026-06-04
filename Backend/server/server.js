

// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";

// import authRoutes from "./routes/authRoutes.js";
// import checkoutRoutes from "./routes/checkoutRoute.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import axios from "axios";
// dotenv.config();

// const app = express();

// app.use(
//     cors({
//         origin: process.env.CLIENT_URL,
//         credentials: true,
//     })
// );

// app.use(express.json());
// app.use(cookieParser());

// app.use("/api/auth", authRoutes);
// app.use("/api/checkout", checkoutRoutes);
// app.use("/api/admin", adminRoutes);



// app.get("/", (req, res) => {
//     res.json({
//         success: true,
//         message: "Backend running successfully",
//     });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import checkoutRoutes from "./routes/checkoutRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";

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
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend running successfully",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});