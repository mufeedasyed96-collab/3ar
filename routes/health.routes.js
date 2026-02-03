const express = require('express');
const { getDb } = require('../database');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const logger = require('../utils/logger.util');

/**
 * GET /health
 * System health check
 */
router.get('/', async (req, res) => {
    const health = {
        status: 'ok',
        db: 'down',
        queue: 'down',
        storage: 'down',
        timestamp: new Date().toISOString(),
        service: 'api',
    };

    try {
        // 1. MongoDB check
        const db = getDb();
        if (db) {
            await db.command({ ping: 1 });
            health.db = 'ok';
        }

        // 2. Queue check (Job collection)
        if (db) {
            const collections = await db.listCollections({ name: 'jobs' }).toArray();
            health.queue = 'ok'; // Collection exists or is accessible
        }

        // 3. Storage check
        const tempFile = path.join(__dirname, '../uploads', `.health_${Date.now()}.tmp`);
        try {
            fs.writeFileSync(tempFile, 'health-check');
            fs.unlinkSync(tempFile);
            health.storage = 'ok';
        } catch (storageErr) {
            logger.error({ event: 'health_check_storage_failed', error: storageErr.message });
            health.storage = 'down';
        }

        if (health.db === 'down' || health.storage === 'down') {
            health.status = 'degraded';
        }

        res.json(health);
    } catch (error) {
        logger.error({ event: 'health_check_failed', error: error.message });
        res.status(500).json({ ...health, status: 'down', error: error.message });
    }
});

module.exports = router;
