const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/fire_safety';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// POST /api/fire-safety/:projectId/upload
router.post('/:projectId/upload', upload.single('file'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database connection failed' });

        // Get current project version
        const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const versionNumber = project.version_number || 1;

        const submission = {
            project_id: new ObjectId(projectId),
            version_number: versionNumber,
            file: {
                original_name: file.originalname,
                stored_name: file.filename,
                path: file.path,
                size: file.size,
                mime: file.mimetype,
                uploaded_at: new Date()
            },
            status: 'queued',
            logs: ['File uploaded, queued for processing'],
            created_at: new Date(),
            updated_at: new Date()
        };

        // ---------------------------------------------------------
        // UNIFIED DB MANAGEMENT: Create File Group & Version
        // ---------------------------------------------------------

        const fileGroups = db.collection('file_groups');
        const fileVersions = db.collection('file_versions');

        // 1. Find or Create File Group
        const groupResult = await fileGroups.findOneAndUpdate(
            { projectId: projectId, type: 'fire_safety' },
            {
                $setOnInsert: { created_at: new Date(), createdBy: 'system', status: 'active' },
                $set: { updated_at: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const group = groupResult.value;

        // 2. Determine new version number
        const latestVersion = await fileVersions.findOne(
            { group_id: group._id.toString() },
            { sort: { version_number: -1 } }
        );
        const nextVersion = (latestVersion?.version_number || 0) + 1;

        // 3. Create File Version with Result
        const dummyResult = {
            schema_pass: false,
            summary: { checks_total: 6, passed: 5, failed: 1 },
            checks: [
                { rule_id: "F-1", title: "Exit count mock", status: "pass" },
                { rule_id: "F-2", title: "Travel distance mock", status: "fail", issue: "Dummy violation: Distance to exit > 45m" },
                { rule_id: "F-3", title: "Fire extinguisher placement", status: "pass" },
                { rule_id: "F-4", title: "Sprinkler coverage check", status: "pass" },
                { rule_id: "F-5", title: "Emergency lighting check", status: "pass" },
                { rule_id: "F-6", title: "Smoke detector spacing", status: "pass" }
            ]
        };

        const newVersion = {
            project_id: projectId,
            group_id: group._id.toString(),
            version_number: nextVersion,
            file_metadata: {
                original_name: file.originalname,
                stored_name: file.filename,
                path: file.path,
                size_bytes: file.size,
                mime_type: file.mimetype,
            },
            upload_reason: 'Initial Upload',
            is_active: true,
            created_at: new Date(),
            results: dummyResult
        };

        // Deactivate old versions
        await fileVersions.updateMany(
            { group_id: group._id.toString() },
            { $set: { is_active: false } }
        );

        await fileVersions.insertOne(newVersion);

        // Update group current version
        await fileGroups.updateOne(
            { _id: group._id },
            { $set: { current_version: nextVersion, updated_at: new Date() } }
        );

        res.json({
            ok: true,
            project_id: projectId,
            discipline: 'fire_safety',
            status: 'done',
            result: dummyResult
        });

    } catch (error) {
        console.error('Error in fire safety upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;
