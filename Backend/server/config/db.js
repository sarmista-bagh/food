import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // 🔥 production safety
    max: 20,              // max connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// CONNECT CHECK
pool
    .connect()
    .then((client) => {
        console.log(" DB Connected Successfully");
        client.release();
    })
    .catch((err) => {
        console.error(" DB Connection Failed:", err.message);
        process.exit(1); // stop server if DB fails
    });

export default pool;