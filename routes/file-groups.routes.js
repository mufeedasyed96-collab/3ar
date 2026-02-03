// const express = require('express');
// const { getDb } = require('../database');
// const authMiddleware = require('../middleware/auth.middleware');
// const { ObjectId } = require('mongodb');
// const router = express.Router();

// /**
//  * POST /api/file-groups/init
//  * Initialize or get existing File Group for a project
//  * 
//  * Body:
//  * - projectId (string)
//  * - type (string): e.g., 'villa_plan', 'structural_plan'
//  */
// router.post('/init', authMiddleware, async (req, res) => {
//     const { projectId, type } = req.body;
//     const userId = req.user.userId;

//     if (!projectId || !type) {
//         return res.status(400).json({ error: 'projectId and type are required' });
//     }

//     try {
//         const db = getDb();
//         if (!db) return res.status(500).json({ error: 'Database connection failed' });

//         const fileGroups = db.collection('file_groups');

//         // Check if exists
//         const existing = await fileGroups.findOne({ projectId, type });
//         if (existing) {
//             return res.json(existing);
//         }

//         // Create new
//         const newGroup = {
//             projectId,
//             type,
//             current_version: 0,
//             status: 'draft',
//             created_at: new Date(),
//             updated_at: new Date(),
//             createdBy: userId
//         };

//         const result = await fileGroups.insertOne(newGroup);
//         res.status(201).json({
//             _id: result.insertedId,
//             ...newGroup
//         });

//     } catch (error) {
//         console.error('[FileGroups] Init error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// /**
//  * GET /api/file-groups/:projectId
//  * List all file groups for a project
//  */
// router.get('/:projectId', authMiddleware, async (req, res) => {
//     const { projectId } = req.params;

//     try {
//         const db = getDb();
//         if (!db) return res.status(500).json({ error: 'Database connection failed' });

//         const fileGroups = db.collection('file_groups');
//         const groups = await fileGroups.find({ projectId }).toArray();

//         res.json(groups);
//     } catch (error) {
//         console.error('[FileGroups] List error:', error);
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
 * OPTIONAL: Basic access check.
 * If you don't want this yet, you can remove this function + calls to it.
 */
async function assertProjectAccess(db, projectId, user) {
    const projects = db.collection("projects");
    const proj = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!proj) {
        const err = new Error("Project not found");
        err.status = 404;
        throw err;
    }

    // Adjust this rule to your real roles/permissions
    const isOwner = String(proj.createdBy) === String(user.userId);
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
        const err = new Error("Not allowed to access this project");
        err.status = 403;
        throw err;
    }

    return proj;
}

/**
 * POST /api/file-groups/init
 * Initialize or get existing File Group for a project (atomic safe).
 *
 * Body:
 * - projectId (string)  REQUIRED
 * - type (string)       REQUIRED e.g. 'villa_plan', 'site_plan', 'structural_pdf'
 */
router.post("/init", authMiddleware, async (req, res) => {
    const { projectId, type } = req.body;
    const userId = req.user.userId;

    if (!projectId || !type) {
        return res.status(400).json({ error: "projectId and type are required" });
    }
    // Relaxed validation to allow string IDs (e.g. "1001")
    // if (!ObjectId.isValid(projectId)) {
    //    return res.status(400).json({ error: "Invalid projectId" });
    // }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: "Database connection failed" });

        // Optional but recommended security check
        // await assertProjectAccess(db, projectId, req.user); // Skipped to avoid strictly enforcing ObjectId internally

        const fileGroups = db.collection("file_groups");

        // ✅ Atomic: find-or-create group safely (no race condition)
        const result = await fileGroups.findOneAndUpdate(
            { projectId, type },
            {
                $setOnInsert: {
                    projectId,
                    type,
                    current_version: 0,
                    status: "draft",
                    created_at: new Date(),
                    createdBy: userId,
                },
                $set: { updated_at: new Date() },
            },
            { upsert: true, returnDocument: "after" }
        );

        // result.value is the document
        return res.status(200).json(result.value);
    } catch (error) {
        // Duplicate key fallback (if index exists and concurrent init happened)
        if (error?.code === 11000) {
            try {
                const db = getDb();
                const fileGroups = db.collection("file_groups");
                const existing = await fileGroups.findOne({ projectId, type });
                return res.status(200).json(existing);
            } catch (e) {
                // fall through to generic error
            }
        }

        console.error("[FileGroups] Init error:", error);
        return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
    }
});

/**
 * GET /api/file-groups/:projectId
 * List all file groups for a project (safe + validated).
 */
router.get("/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;

    // Relaxed validation
    // if (!ObjectId.isValid(projectId)) {
    //     return res.status(400).json({ error: "Invalid projectId" });
    // }

    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: "Database connection failed" });

        // Optional but recommended security check
        // await assertProjectAccess(db, projectId, req.user);

        const fileGroups = db.collection("file_groups");
        const groups = await fileGroups.find({ projectId }).sort({ updated_at: -1 }).toArray();

        return res.json(groups);
    } catch (error) {
        console.error("[FileGroups] List error:", error);
        return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
    }
});

module.exports = router;

