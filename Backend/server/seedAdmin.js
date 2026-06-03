import bcrypt from "bcrypt";
import pool from "./config/db.js";

const seedAdmin = async () => {
    try {
        const email = "admin@test.com";

        // 🔍 check if already exists
        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existing.rows.length > 0) {
            console.log("Superadmin already exists");
            process.exit();
        }

        //  hash password
        const hashedPassword = await bcrypt.hash("123456", 10);

        //  create SUPERADMIN (not admin)
        await pool.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)`,
            ["Super Admin", email, hashedPassword, "superadmin"]
        );

        console.log(" Superadmin created successfully");
        process.exit();

    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
};

seedAdmin();