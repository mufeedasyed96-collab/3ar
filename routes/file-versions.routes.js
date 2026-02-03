// const express = require('express');
// const { getDb } = require('../database');
// const authMiddleware = require('../middleware/auth.middleware');
// const { ObjectId } = require('mongodb');
// const router = express.Router();

// /**
//  * GET /api/file-versions/:groupId
//  * List versions for a file group
//  */
// router.get('/:groupId', authMiddleware, async (req, res) => {
//     const { groupId } = req.params;

//     try {
//         const db = getDb();
//         if (!db) return res.status(500).json({ error: 'Database connection failed' });

//         const fileVersions = db.collection('file_versions');

//         // Sort by version number desc
//         const versions = await fileVersions
//             .find({ group_id: groupId })
//             .sort({ version_number: -1 })
//             .toArray();

//         res.json(versions);
//     } catch (error) {
//         console.error('[FileVersions] List error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// /**
//  * GET /api/file-versions/project/:projectId
//  * List all versions for a project (optional, flat list)
//  */
// router.get('/project/:projectId', authMiddleware, async (req, res) => {
//     const { projectId } = req.params;

//     try {
//         const db = getDb();
//         if (!db) return res.status(500).json({ error: 'Database connection failed' });

//         const fileVersions = db.collection('file_versions');
//         const versions = await fileVersions
//             .find({ project_id: projectId })
//             .sort({ created_at: -1 })
//             .toArray();

//         res.json(versions);
//     } catch (error) {
//         console.error('[FileVersions] Project List error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// /**
//  * POST /api/file-versions/:groupId/activate/:versionId
//  * Set a specific version as active
//  */
// router.post('/:groupId/activate/:versionId', authMiddleware, async (req, res) => {
//     const { groupId, versionId } = req.params;
//     const userId = req.user.userId;

//     try {
//         const db = getDb();
//         if (!db) return res.status(500).json({ error: 'Database connection failed' });

//         const fileVersions = db.collection('file_versions');

//         // 1. Validate ownership/access (skipped for brevity, assuming authMiddleware allows)

//         // 2. Deactivate all for this group (Atomic updateMany)
//         await fileVersions.updateMany(
//             { group_id: groupId, is_active: true },
//             { $set: { is_active: false } }
//         );

//         // 3. Activate target
//         const result = await fileVersions.updateOne(
//             { _id: new ObjectId(versionId), group_id: groupId },
//             { $set: { is_active: true } }
//         );

//         if (result.matchedCount === 0) {
//             return res.status(404).json({ error: 'Version not found' });
//         }

//         // 4. Audit Log
//         const historyColl = db.collection('history');
//         await historyColl.insertOne({
//             action: 'ACTIVATE_VERSION',
//             groupId: new ObjectId(groupId),
//             versionId: new ObjectId(versionId),
//             userId,
//             timestamp: new Date()
//         });

//         res.json({ success: true, message: 'Version activated' });

//     } catch (error) {
//         console.error('[FileVersions] Activate error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router;

const express = require("express");
const { getDb } = require("../database");
const authMiddleware = require("../middleware/auth.middleware");
const { ObjectId } = require("mongodb");

const router = express.Router();

/**
 * OPTIONAL helper: enforce project access using file_groups -> projects
 * Remove if you don't want access control yet.
 */
async function assertGroupAccess(db, groupId, user) {
    const fileGroups = db.collection("file_groups");
    const projects = db.collection("projects");

    // group _id in file_groups is ObjectId
    if (!ObjectId.isValid(groupId)) {
        const err = new Error("Invalid groupId");
        err.status = 400;
        throw err;
    }

    const group = await fileGroups.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
        const err = new Error("File group not found");
        err.status = 404;
        throw err;
    }

    // group.projectId stored as string in your schema
    if (!ObjectId.isValid(group.projectId)) {
        const err = new Error("File group has invalid projectId");
        err.status = 500;
        throw err;
    }

    const proj = await projects.findOne({ _id: new ObjectId(group.projectId) });
    if (!proj) {
        const err = new Error("Project not found");
        err.status = 404;
        throw err;
    }

    const isOwner = String(proj.createdBy) === String(user.userId);
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
        const err = new Error("Not allowed");
        err.status = 403;
        throw err;
    }

    return { group, proj };
}

/**
 * ✅ IMPORTANT: put /project route BEFORE /:groupId route
 * GET /api/file-versions/project/:projectId
 * List all versions for a project (flat list)
 */
router.get("/project/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;

    if (!ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: "Invalid projectId" });
    }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: "Database connection failed" });

        const fileVersions = db.collection("file_versions");
        const versions = await fileVersions
            .find({ project_id: projectId })
            .sort({ created_at: -1 })
            .toArray();

        return res.json(versions);
    } catch (error) {
        console.error("[FileVersions] Project List error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/file-versions/:groupId
 * List versions for a file group
 *
 * NOTE: file_versions.group_id is stored as STRING in your DB.
 * groupId param here should be the file_groups._id string.
 */
router.get("/:groupId", authMiddleware, async (req, res) => {
    const { groupId } = req.params;

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: "Database connection failed" });

        // Optional access enforcement
        await assertGroupAccess(db, groupId, req.user);

        const fileVersions = db.collection("file_versions");

        const versions = await fileVersions
            .find({ group_id: groupId })         // ✅ group_id is a string
            .sort({ version_number: -1 })
            .toArray();

        return res.json(versions);
    } catch (error) {
        console.error("[FileVersions] List error:", error);
        return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
    }
});

/**
 * POST /api/file-versions/:groupId/activate/:versionId
 * Set a specific version as active, and sync file_groups.current_version
 */
router.post("/:groupId/activate/:versionId", authMiddleware, async (req, res) => {
    const { groupId, versionId } = req.params;
    const userId = req.user.userId;

    if (!ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: "Invalid groupId" });
    }
    if (!ObjectId.isValid(versionId)) {
        return res.status(400).json({ error: "Invalid versionId" });
    }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: "Database connection failed" });

        // Optional access enforcement
        const { group } = await assertGroupAccess(db, groupId, req.user);

        const fileVersions = db.collection("file_versions");
        const fileGroups = db.collection("file_groups");
        const historyColl = db.collection("history");

        // 1) Load target version (and ensure it belongs to the group)
        const target = await fileVersions.findOne({
            _id: new ObjectId(versionId),
            group_id: groupId, // ✅ group_id stored as string
        });

        if (!target) {
            return res.status(404).json({ error: "Version not found in this group" });
        }

        // 2) Deactivate all active for this group
        await fileVersions.updateMany(
            { group_id: groupId, is_active: true },
            { $set: { is_active: false } }
        );

        // 3) Activate target
        await fileVersions.updateOne(
            { _id: new ObjectId(versionId) },
            { $set: { is_active: true } }
        );

        // 4) Sync file_groups.current_version to the target version_number
        await fileGroups.updateOne(
            { _id: new ObjectId(groupId) },
            { $set: { current_version: target.version_number, updated_at: new Date() } }
        );

        // 5) Audit log (store groupId as string or ObjectId consistently)
        await historyColl.insertOne({
            action: "ACTIVATE_VERSION",
            projectId: group.projectId,          // string
            groupId: groupId,                    // string (consistent)
            versionId: versionId,                // string (consistent)
            versionNumber: target.version_number,
            userId,
            timestamp: new Date(),
        });

        return res.json({
            success: true,
            message: "Version activated",
            groupId,
            active_version: target.version_number,
        });
    } catch (error) {
        // If you have unique partial index on (group_id, is_active=true), concurrent activation can throw 11000
        if (error?.code === 11000) {
            return res.status(409).json({ error: "Another activation happened simultaneously. Please refresh and try again." });
        }

        console.error("[FileVersions] Activate error:", error);
        return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
    }
});

module.exports = router;
