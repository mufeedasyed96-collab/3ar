const express = require('express');
const { getDb, ObjectId } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * POST /api/projects
 * Create a new project
 * 
 * Body:
 * - projectType (string)
 * - ownerName (string)
 * - consultantName (string)
 * - plotNo (string)
 * - zone (string)
 * - city (string)
 */
router.post('/', authMiddleware, async (req, res) => {
    const {
        projectType,
        ownerName,
        consultantName,
        plotNo,
        zone,
        city,
        applicationId
    } = req.body;

    // Auth middleware attaches user info to req.user
    const createdBy = req.user.userId;
    const createdByEmail = req.user.email;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const projects = db.collection('projects');

        let version = 1;
        let existingProject = null;

        if (applicationId) {
            // Check if project already exists with this ID
            existingProject = await projects.findOne({ _id: applicationId });

            if (existingProject) {
                // If it exists, increment the project-level version
                version = (existingProject.version || 1) + 1;

                const updateDoc = {
                    $set: {
                        projectType,
                        ownerName,
                        consultantName,
                        plotNo,
                        zone,
                        city,
                        version: version,
                        updatedAt: new Date()
                    },
                    $push: {
                        statusHistory: {
                            status: 'Updated',
                            changedBy: createdBy,
                            changedByEmail: createdByEmail,
                            changedAt: new Date(),
                            reason: `Project updated with new version ${version}`
                        }
                    }
                };

                await projects.updateOne({ _id: applicationId }, updateDoc);

                const updatedProject = await projects.findOne({ _id: applicationId });

                return res.status(200).json({
                    id: applicationId,
                    message: 'Project updated successfully',
                    project: {
                        id: applicationId,
                        ...updatedProject,
                        createdAt: updatedProject.createdAt.toISOString(),
                        updatedAt: updatedProject.updatedAt.toISOString()
                    }
                });
            }
        }

        const newProject = {
            _id: (applicationId && String(applicationId).trim()) ? String(applicationId).trim() : new ObjectId().toString(),
            projectType,
            ownerName,
            consultantName,
            plotNo,
            zone,
            city,
            applicationId: applicationId || null,
            version: version,
            status: 'New',
            statusHistory: [{
                status: 'New',
                changedBy: createdBy,
                changedByEmail: createdByEmail,
                changedAt: new Date(),
                reason: 'Project created'
            }],
            createdBy: createdBy,
            createdByEmail: createdByEmail,
            createdAt: new Date(),
        };

        const result = await projects.insertOne(newProject);
        const insertedId = applicationId || result.insertedId.toString();

        res.status(201).json({
            id: insertedId,
            message: 'Project created successfully',
            project: {
                id: insertedId,
                ...newProject,
                createdAt: newProject.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error('[Projects] Create error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/projects/:id
 * Update project details
 */
router.patch('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const projects = db.collection('projects');
        const { ObjectId } = require('mongodb');

        // Check if id is a valid ObjectId, otherwise treat as string (applicationId)
        let filter;
        try {
            filter = { _id: new ObjectId(id), createdBy: userId };
        } catch (e) {
            filter = { _id: id, createdBy: userId };
        }
        const { _id, ...safeUpdates } = updates; // prevent updating _id if passed

        let updateDoc = {
            $set: {
                ...safeUpdates,
                updatedAt: new Date()
            }
        };

        // If status is changing, push to history
        if (updates.status) {
            updateDoc.$push = {
                statusHistory: {
                    status: updates.status,
                    changedBy: userId,
                    changedByEmail: req.user.email,
                    changedAt: new Date(),
                    reason: updates.reason || 'Status updated'
                }
            };

            // Clean up 'reason' from $set if it was passed just for history
            if (updateDoc.$set.reason) delete updateDoc.$set.reason;
        }

        const result = await projects.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('[Projects] Update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/projects/:id
 * Get project details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        const projects = db.collection('projects');
        const { ObjectId } = require('mongodb');

        let filter;
        try {
            filter = { _id: new ObjectId(id), createdBy: userId };
        } catch (e) {
            filter = { _id: id, createdBy: userId };
        }

        const project = await projects.findOne(filter);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({
            id: project._id.toString(),
            ...project,
            createdAt: project.createdAt ? project.createdAt.toISOString() : null,
            updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null
        });
    } catch (error) {
        console.error('[Projects] Get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
