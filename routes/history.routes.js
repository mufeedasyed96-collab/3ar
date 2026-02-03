const express = require('express');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth.middleware');
const { ObjectId } = require('mongodb');
const router = express.Router();

/**
 * Robust History API
 * - Validates inputs (userId, pagination)
 * - Safe type conversions (ObjectId, Date)
 * - Contextual logging via req.log (Pino)
 * - Standardized error responses
 */

// Helper: Safe ObjectID validation
const isValidId = (id) => {
    return id && typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};

// Helper: Safe Date serializer
const safeIsoDate = (date) => {
    if (date instanceof Date && !isNaN(date)) return date.toISOString();
    return new Date().toISOString(); // Fallback to now if invalid/missing
};

// POST /api/history - Save history item
router.post('/', authMiddleware, async (req, res) => {
    const { owner, fileName, referenceCode, overallStatus, summaryText, result, projectId } = req.body;
    const userId = req.user.userId;

    // Use contextual logger (attached by observability middleware)
    const log = req.log || console;

    if (!fileName) {
        return res.status(400).json({ error: 'fileName is required', code: 'VALIDATION_ERROR' });
    }

    try {
        const db = getDb();
        if (!db) {
            log.error('Database connection unavailable');
            return res.status(500).json({ error: 'Service unavailable', code: 'DB_CONNECTION_ERROR' });
        }

        const history = db.collection('history');

        const newEntry = {
            userId,
            projectId: projectId || null, // Store as provided (usually string)
            owner: owner || null,
            fileName,
            referenceCode: referenceCode || null,
            overallStatus: overallStatus || 'unknown',
            summaryText: summaryText || '',
            result_json: result || {}, // Guard against null
            savedAt: new Date(),
        };

        const insertResult = await history.insertOne(newEntry);

        log.info({
            event: 'history_saved',
            historyId: insertResult.insertedId,
            projectId
        }, 'History item saved successfully');

        res.status(201).json({
            id: insertResult.insertedId.toString(),
            ...newEntry,
            saved_at: safeIsoDate(newEntry.savedAt)
        });

    } catch (error) {
        log.error({ err: error, body: req.body }, 'Failed to save history item');
        res.status(500).json({ error: 'Internal server error', code: 'HISTORY_SAVE_ERROR' });
    }
});

// GET /api/history - List history (from projects collection)
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    // Input sanitization
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 200) limit = 200; // Hard cap

    const log = req.log || console;

    try {
        const db = getDb();
        if (!db) {
            log.error('Database connection unavailable');
            return res.status(500).json({ error: 'Service unavailable', code: 'DB_CONNECTION_ERROR' });
        }

        const projects = db.collection('projects');

        // Fetch projects created by this user
        const pipeline = [
            // 1. Match projects created by user
            { $match: { createdBy: userId } },

            // 2. Sort by most recent first
            { $sort: { createdAt: -1 } },

            // 3. Limit
            { $limit: limit },

            // 4. Lookup Client Metadata (passport/EID names)
            {
                $lookup: {
                    from: 'client_metadata',
                    localField: 'applicationId',
                    foreignField: 'applicationId',
                    as: 'clientMetadata'
                }
            },

            // 5. Unwind client metadata
            {
                $unwind: {
                    path: '$clientMetadata',
                    preserveNullAndEmptyArrays: true
                }
            },

            // 6. Lookup latest file version for validation status
            {
                $lookup: {
                    from: 'file_versions',
                    let: { projId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$projectId', '$$projId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'latestVersion'
                }
            },

            // 7. Unwind latest version
            {
                $unwind: {
                    path: '$latestVersion',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const items = await projects.aggregate(pipeline).toArray();

        // Format response for frontend compatibility
        const formattedItems = items.map(item => ({
            id: item._id.toString(),
            projectId: item._id.toString(),
            applicationId: item.applicationId || item._id.toString(),
            userId: item.createdBy,
            owner: item.ownerName || null,
            fileName: item.latestVersion?.fileName || `Project ${item._id}`,
            file_name: item.latestVersion?.fileName || `Project ${item._id}`,
            referenceCode: item.latestVersion?.referenceCode || null,
            reference_code: item.latestVersion?.referenceCode || null,
            overallStatus: item.latestVersion?.validationResult?.overallStatus || item.status || 'pending',
            overall_status: item.latestVersion?.validationResult?.overallStatus || item.status || 'pending',
            summaryText: item.latestVersion?.validationResult?.summaryText || '',
            summary_text: item.latestVersion?.validationResult?.summaryText || '',
            result_json: item.latestVersion?.validationResult || null,
            savedAt: item.createdAt,
            saved_at: safeIsoDate(item.createdAt),
            projectData: {
                _id: item._id.toString(),
                applicationId: item.applicationId || item._id.toString(),
                projectType: item.projectType,
                ownerName: item.ownerName,
                clientMetadata: item.clientMetadata || null,
                status: item.status,
                version: item.version
            },
            clientMetadata: item.clientMetadata || null
        }));

        res.json(formattedItems);

    } catch (error) {
        log.error({ err: error, userId }, 'Failed to list history items');
        res.status(500).json({ error: 'Internal server error', code: 'HISTORY_LIST_ERROR' });
    }
});



// DELETE /api/history/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const log = req.log || console;

    // 1. ID Validation - Prevent crashes on invalid ObjectId
    if (!isValidId(id)) {
        return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
    }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Service unavailable' });

        const history = db.collection('history');

        const result = await history.deleteOne({
            _id: new ObjectId(id),
            userId: userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Item not found or unauthorized', code: 'NOT_FOUND' });
        }

        res.json({ message: 'Item deleted successfully' });

    } catch (error) {
        log.error({ err: error, id }, 'Failed to delete history item');
        res.status(500).json({ error: 'Internal server error', code: 'HISTORY_DELETE_ERROR' });
    }
});

// DELETE /api/history - Clear all
router.delete('/', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const log = req.log || console;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Service unavailable' });

        const history = db.collection('history');
        await history.deleteMany({ userId });

        res.json({ message: 'History cleared successfully' });

    } catch (error) {
        log.error({ err: error, userId }, 'Failed to clear history');
        res.status(500).json({ error: 'Internal server error', code: 'HISTORY_CLEAR_ERROR' });
    }
});

module.exports = router;
