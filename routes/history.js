const express = require('express');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { ObjectId } = require('mongodb');
const router = express.Router();

// Save history item
router.post('/', authMiddleware, async (req, res) => {
    const { owner, fileName, referenceCode, overallStatus, summaryText, result, projectId } = req.body;
    const userId = req.user.userId;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const history = db.collection('history');

        const newEntry = {
            userId,
            projectId: projectId || null,
            owner: owner || null,
            fileName,
            referenceCode,
            overallStatus,
            summaryText,
            result_json: result,
            savedAt: new Date(),
        };

        const insertResult = await history.insertOne(newEntry);
        res.status(201).json({
            id: insertResult.insertedId.toString(),
            ...newEntry,
            saved_at: newEntry.savedAt.toISOString()
        });
    } catch (error) {
        console.error('[History] Save error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List history for current user
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const history = db.collection('history');

        const pipeline = [
            { $match: { userId: userId } },
            { $sort: { savedAt: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    projectIdObj: {
                        $cond: {
                            if: { $and: [{ $ne: ["$projectId", null] }, { $ne: ["$projectId", ""] }] },
                            then: { $toObjectId: "$projectId" },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'projects',
                    localField: 'projectIdObj',
                    foreignField: '_id',
                    as: 'projectData'
                }
            },
            {
                $unwind: {
                    path: '$projectData',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const items = await history.aggregate(pipeline).toArray();

        // Map _id to id for frontend compatibility
        const formattedItems = items.map(item => ({
            ...item,
            id: item._id.toString(),
            userId: item.userId.toString(),
            saved_at: item.savedAt ? item.savedAt.toISOString() : new Date().toISOString()
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('[History] List error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete history item
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const history = db.collection('history');

        const result = await history.deleteOne({
            _id: new ObjectId(id),
            userId: userId // Ensure user owns the item
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Item not found or unauthorized' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('[History] Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear all history for current user
router.delete('/', authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const history = db.collection('history');

        await history.deleteMany({ userId });

        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('[History] Clear error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
