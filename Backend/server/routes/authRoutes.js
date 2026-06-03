import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/* ---------------- COOKIE SETTINGS ---------------- */
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
};

/* ---------------- JWT TOKEN ---------------- */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/* ---------------- REGISTER ---------------- */
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        email = email.toLowerCase();

        // ✅ basic password strength check
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // check user exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 🔥 PASSWORD HASHING
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔥 ROLE SECURITY
        const allowedRoles = ["customer", "restaurant"];
        const finalRole = allowedRoles.includes(role) ? role : "customer";

        // insert user
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role`,
            [name, email, hashedPassword, finalRole]
        );

        const user = newUser.rows[0];

        const token = generateToken(user);

        res.cookie('token', token, cookieOptions);

        return res.status(201).json({
            user,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
});

/* ---------------- LOGIN ---------------- */
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        email = email.toLowerCase();

        // ✅ safer query (no unnecessary data leak)
        const userResult = await pool.query(
            'SELECT id, name, email, password, role FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const userData = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // ❌ do NOT include password in token
        const token = generateToken({
            id: userData.id,
            role: userData.role
        });

        res.cookie('token', token, cookieOptions);

        return res.json({
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role
            },
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
});

/* ---------------- ME ---------------- */
router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

/* ---------------- LOGOUT ---------------- */
router.post('/logout', (req, res) => {
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    res.json({ message: 'Logged out successfully' });
});

export default router;