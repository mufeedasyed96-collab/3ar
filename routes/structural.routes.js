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
        const uploadDir = 'uploads/structural';
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

// POST /api/structural/:projectId/upload
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

        // 1. Find or Create File Group (Atomic Upsert)
        const groupResult = await fileGroups.findOneAndUpdate(
            { projectId: projectId, type: 'structural' },
            {
                $setOnInsert: { created_at: new Date(), createdBy: 'system', status: 'active' },
                $set: { updated_at: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const group = groupResult.value;

        // 2. Determine new version number
        // Find latest version for this group
        const latestVersion = await fileVersions.findOne(
            { group_id: group._id.toString() }, // ensure group_id is string if that's the strict schema
            { sort: { version_number: -1 } }
        );
        const nextVersion = (latestVersion?.version_number || 0) + 1;

        // 3. Create File Version
        // Store dummy result directly in the version for history retrieval
        const dummyResult = {
            schema_pass: true,
            summary: { checks_total: 6, passed: 6, failed: 0 },
            checks: [
                { rule_id: "S-1", title: "Column grid detected", status: "pass" },
                { rule_id: "S-2", "title": "Beam continuity mock", "status": "pass" },
                { rule_id: "S-3", "title": "Load path validation", "status": "pass" },
                { rule_id: "S-4", "title": "Material properties check", "status": "pass" },
                { rule_id: "S-5", "title": "Section adequacy", "status": "pass" },
                { rule_id: "S-6", "title": "Deflection limits", "status": "pass" }
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
            results: dummyResult // ✅ Storing result in DB history
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
            discipline: 'structural',
            status: 'done', // Immediate done for demo
            result: dummyResult
        });

    } catch (error) {
        console.error('Error in structural upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dummy processor not needed if we return immediate result, 
// allows simpler "fake" result storage as requested.
/*
async function processStructuralSubmission(submissionId, db) {
    // ...
}
*/

module.exports = router;
