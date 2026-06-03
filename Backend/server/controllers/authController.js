import pool from "../config/db.js";
import bcrypt from "bcrypt";

/* ---------------- SIGNUP ---------------- */
export const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required",
            });
        }

        const emailLower = email.toLowerCase();

        // 2. Check user exists
        const userExists = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [emailLower]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. SAFE ROLE HANDLING
        const allowedRoles = ["customer", "restaurant"];

        let finalRole = "customer";

        if (role && allowedRoles.includes(role)) {
            finalRole = role;
        }

        // BLOCK SUPERADMIN FROM FRONTEND
        if (role === "superadmin") {
            return res.status(403).json({
                message: "Not allowed",
            });
        }

        // 5. INSERT USER
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
            [name, emailLower, hashedPassword, finalRole]
        );

        // 6. RESPONSE
        res.status(201).json({
            message: "Signup successful",
            user: newUser.rows[0],
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};