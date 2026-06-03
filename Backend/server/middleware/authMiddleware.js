import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
        // 🔐 GET TOKEN (cookie OR header fallback)
        const token =
            req.cookies?.token ||
            (req.headers.authorization &&
                req.headers.authorization.startsWith("Bearer")
                ? req.headers.authorization.split(" ")[1]
                : null);

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // 🔐 VERIFY TOKEN
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Token invalid or expired" });
        }

        // 👤 GET USER FROM DB
        const userResult = await pool.query(
            `SELECT id, name, email, role, is_blocked 
       FROM users 
       WHERE id = $1`,
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        // 🚫 BLOCK CHECK
        if (user.is_blocked) {
            return res.status(403).json({ message: "User blocked" });
        }

        // ✅ ATTACH USER
        req.user = user;

        next();

    } catch (error) {
        console.log("Protect middleware error:", error);
        return res.status(401).json({ message: "Authentication failed" });
    }
};