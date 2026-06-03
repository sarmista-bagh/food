import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// ================= ROUTES =================
import authRoutes from "./routes/authRoutes.js";
import checkoutRoutes from "./routes/checkoutRoute.js";
import adminRoutes from "./routes/adminRoutes.js";

// ================= CONFIG =================
dotenv.config();

const app = express();

/* ---------------- MIDDLEWARES ---------------- */
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/admin", adminRoutes);

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
    res.send("API Running Successfully");
});

/* ---------------- SERVER START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});