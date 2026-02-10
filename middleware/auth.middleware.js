const { getDb } = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.jwt_secret || 'miyar_secret_key_123';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (token === 'guest-token') {
        req.user = { userId: 'guest', email: 'guest@miyar.ai', name: 'Guest User' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Token verification failed:', error.message);
        console.error('[AuthMiddleware] Received Token (first 20 chars):', token.substring(0, 20) + '...');
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
