const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.jwt_secret || 'miyar_secret_key_123';
const SALT_ROUNDS = 10;

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const users = db.collection('users');

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        const result = await users.insertOne(newUser);

        // Generate JWT
        const token = jwt.sign(
            { userId: result.insertedId.toString(), email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.insertedId.toString(),
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('[Auth] Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const users = db.collection('users');

        // Find user by email
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email not registered' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
