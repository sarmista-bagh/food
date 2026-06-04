import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // ssl: {
    //     rejectUnauthorized: false,
    // },
});

pool
    .connect()
    .then((client) => {
        console.log("DB Connected Successfully");
        client.release();
    })
    .catch((err) => {
        console.error("DB Connection Failed:", err);
        process.exit(1);
    });

export default pool;