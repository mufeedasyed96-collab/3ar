// routes/projects.routes.js
// Municipality-grade Projects Routes (NO 404 mismatches, supports applicationId + real _id)

const express = require("express");
const router = express.Router();

const { getDb, ObjectId } = require("../database");
const authMiddleware = require("../middleware/auth.middleware");
const { checkProjectLock } = require("../middleware/lock.middleware");

/** -----------------------------
 * Helpers
 * ----------------------------- */

const PREFIX_MAP = {
    AV: ["villa", "all_villa", "villa_plan"],
    AF: ["alfalah_villa"],
    YV: ["yas_villa"],
    BR: ["bridges"],
    RD: ["roads", "roads_and_access"],
    RB: ["roads_bridges"],
    WH: ["warehouse"],
    SM: ["shopping_mall"],
    OB: ["office_building"],
    RS: ["resort"],
    ST: ["structural", "structural_plan"],
    FS: ["fire_safety", "fire_safety_plan"],
    FM: ["farm"],
    UT: ["utilities"],
    DR: ["drainage"],
    CM: ["commercial"],
    IN: ["infrastructure"],
};

function getPrefix(projectType) {
    for (const [prefix, types] of Object.entries(PREFIX_MAP)) {
        if (types.includes(projectType)) return prefix;
    }
    return "OT";
}

function col(name) {
    const db = getDb();
    if (!db) throw new Error("Database connection failed");
    return db.collection(name);
}

/**
 * Resolve a project by:
 * - Mongo ObjectId _id
 * - string _id (applicationId stored as _id string)
 * - applicationNo field (prefixed)
 * - applicationId field (legacy raw)
 *
 * Always scopes to createdBy userId (officer)
 */
async function resolveProject(projectsCollection, id, userId) {
    const { ObjectId: MongoObjectId } = require("mongodb");

    let query;
    try {
        query = {
            $or: [
                { _id: new MongoObjectId(id) }, // if id is ObjectId-like
                { _id: id },                    // string _id (legacy or custom)
                { applicationNo: id },          // new prefixed field
                { applicationId: id },          // legacy field
            ],
            createdBy: userId,
        };
    } catch {
        // not a valid ObjectId string
        query = {
            $or: [
                { _id: id },
                { applicationNo: id },
                { applicationId: id }
            ],
            createdBy: userId,
        };
    }

    return projectsCollection.findOne(query);
}

function safeIso(d) {
    if (!d) return null;
    try {
        return new Date(d).toISOString();
    } catch {
        return null;
    }
}

/** -----------------------------
 * IMPORTANT ROUTE ORDER
 * Put "nested" routes BEFORE "/:id"
 * ----------------------------- */

/**
 * GET /api/projects/format-application-no
 * Helper to preview formatted number
 */
router.get("/format-application-no", authMiddleware, (req, res) => {
    const { projectType, raw } = req.query;
    if (!projectType || !raw) return res.status(400).json({ error: "Missing projectType or raw number" });
    const prefix = getPrefix(projectType);
    return res.json({ applicationNo: `${prefix}-${raw}` });
});

/**
 * GET /api/projects/:projectId/discipline-status
 * Used by frontend report page
 */
router.get("/:projectId/discipline-status", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
        const projects = col("projects");
        const fileGroups = col("file_groups");

        const project = await resolveProject(projects, projectId, userId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const realProjectId = project._id.toString();

        const structuralGroup = await fileGroups.findOne({
            projectId: realProjectId,
            type: "structural_plan",
        });

        const fireSafetyGroup = await fileGroups.findOne({
            projectId: realProjectId,
            type: "fire_safety_plan",
        });

        return res.json({
            architectural: "done",
            structural: structuralGroup ? structuralGroup.status || "pending" : "pending",
            fireSafety: fireSafetyGroup ? fireSafetyGroup.status || "pending" : "pending",
        });
    } catch (err) {
        console.error("[Projects] Discipline status error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/projects/:projectId/certificate
 * Returns latest certificate (stored using realProjectId)
 * Supports appId / string id / ObjectId id
 */
router.get("/:projectId/certificate", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
        const projects = col("projects");
        const certificates = col("certificates");

        const project = await resolveProject(projects, projectId, userId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const realProjectId = project._id.toString();

        // Optional discipline filtering (safe to ignore if you don't store it)
        const discipline = req.query.discipline ? String(req.query.discipline) : null;

        const q = { project_id: realProjectId };
        if (discipline) q.discipline = discipline;

        const cert = await certificates
            .find(q)
            .sort({ version_number: -1, created_at: -1 })
            .limit(1)
            .next();

        if (!cert) return res.status(404).json({ error: "Certificate not found" });

        return res.json(cert);
    } catch (err) {
        console.error("[Projects] Get certificate error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/projects/:projectId/certificate/download
 * Download latest certificate PDF
 */
router.get("/:projectId/certificate/download", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
        const path = require("path");
        const fs = require("fs");

        const projects = col("projects");
        const certificates = col("certificates");

        const project = await resolveProject(projects, projectId, userId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const realProjectId = project._id.toString();
        const discipline = req.query.discipline ? String(req.query.discipline) : null;

        const q = { project_id: realProjectId };
        if (discipline) q.discipline = discipline;

        const cert = await certificates
            .find(q)
            .sort({ version_number: -1, created_at: -1 })
            .limit(1)
            .next();

        if (!cert || !cert.pdf_path) return res.status(404).json({ error: "Certificate not found" });

        const filePath = path.resolve(__dirname, "..", cert.pdf_path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Certificate file missing on server" });
        }

        const filename = cert.filename || `Certificate-${realProjectId}.pdf`;
        return res.download(filePath, filename);
    } catch (err) {
        console.error("[Projects] Download certificate error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /api/projects/:projectId/submit
 * Create workflow record for async pipeline
 */
router.post("/:projectId/submit", authMiddleware, checkProjectLock, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.userId;
    const correlationId = req.correlationId;

    try {
        const projects = col("projects");
        const workflows = col("workflows");

        const project = await resolveProject(projects, projectId, userId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const realProjectId = project._id.toString();

        const workflowRecord = {
            projectId: realProjectId,
            correlation_id: correlationId,
            status: "pending",
            current_step: "Upload",
            steps: [
                { name: "Upload", status: "completed", started_at: new Date(), completed_at: new Date() },
                { name: "Normalize", status: "pending" },
                { name: "Extract", status: "pending" },
                { name: "Validate", status: "pending" },
            ],
            created_at: new Date(),
            updated_at: new Date(),
        };

        const r = await workflows.insertOne(workflowRecord);

        return res.json({
            message: "Project submitted successfully",
            workflow_id: r.insertedId.toString(),
            correlation_id: correlationId,
        });
    } catch (err) {
        console.error("[Projects] Submit error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /api/projects/:projectId/versions/:versionNumber/decision
 * Accepts BOTH formats:
 * 1) { decision: "approved", notes?: "..." }
 * 2) { decision: { type: "approved" }, notes?: "..." }
 * 3) { decision: { type: "approved_with_conditions", conditions: [...] } }
 * 4) { type: "approved", notes?: "..." }  <-- Added fallback
 */
router.post(
    "/:projectId/versions/:versionNumber/decision",
    authMiddleware,
    checkProjectLock,
    async (req, res) => {
        const { projectId, versionNumber } = req.params;
        const userId = req.user.userId;

        // ✅ Accept string OR object (nested in 'decision') OR root object
        let rawDecision = req.body?.decision;

        // Fallback: if 'decision' key is missing, check if 'type' or 'decision_type' is at root
        if (!rawDecision) {
            if (req.body?.type) rawDecision = req.body.type;
            else if (req.body?.decision_type) rawDecision = req.body.decision_type;
            else if (req.body?.decision) rawDecision = req.body.decision;
        }

        const decisionType =
            typeof rawDecision === "string"
                ? rawDecision
                : rawDecision?.type || rawDecision?.decision || rawDecision?.decision_type || null;

        const notes = req.body?.notes || req.body?.remarks; // Frontend sends 'remarks' sometimes

        if (!decisionType) {
            console.log("[DEBUG] Invalid decision payload:", req.body);
            return res.status(400).json({
                error: "Missing decision. Expected approved / rejected / approved_with_conditions / returned",
            });
        }

        try {
            const projects = col("projects");
            const projectDecisions = col("project_decisions");

            const project = await resolveProject(projects, projectId, userId);
            if (!project) return res.status(404).json({ error: "Project not found" });

            const realProjectId = project._id.toString();

            const decisionRecord = {
                project_id: realProjectId,
                version_number: parseInt(versionNumber, 10),
                decision: decisionType,
                // store full object snapshot if provided (conditions etc.)
                decision_payload: typeof rawDecision === "object" ? rawDecision : null,
                notes: notes || null,
                officer_id: userId,
                created_at: new Date(),
            };

            await projectDecisions.insertOne(decisionRecord);

            // Update project status
            let newStatus = "Under Review";
            if (decisionType === "approved") newStatus = "Approved";
            else if (decisionType === "rejected") newStatus = "Rejected";
            else if (decisionType === "approved_with_conditions") newStatus = "Approved with Conditions";
            else if (decisionType === "returned") newStatus = "Returned";

            await projects.updateOne(
                { _id: project._id },
                {
                    $set: { status: newStatus, updatedAt: new Date() },
                    $push: {
                        statusHistory: {
                            status: newStatus,
                            changedBy: userId,
                            changedByEmail: req.user.email,
                            changedAt: new Date(),
                            reason: `Decision: ${decisionType}`,
                        },
                    },
                }
            );

            return res.json({ message: "Decision recorded successfully", status: newStatus });
        } catch (err) {
            console.error("[Projects] Decision error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * POST /api/projects/:projectId/versions/:versionNumber/certificate
 * Generates a PDF certificate ONLY for approved / approved_with_conditions
 */
router.post(
    "/:projectId/versions/:versionNumber/certificate",
    authMiddleware,
    async (req, res) => {
        const { projectId, versionNumber } = req.params;
        const userId = req.user.userId;

        try {
            const path = require("path");
            const fs = require("fs");

            const projects = col("projects");
            const clientMeta = col("client_metadata");
            const validationResults = col("validation_results");
            const projectDecisions = col("project_decisions");
            const certificates = col("certificates");

            const { generateCertificatePdf } = require("../services/pdf.service");

            // 1) Resolve Project
            const project = await resolveProject(projects, projectId, userId);
            if (!project) return res.status(404).json({ error: "Project not found" });

            const realProjectId = project._id.toString();

            // Optional discipline (store it so future filtering works)
            const discipline =
                (req.query.discipline ? String(req.query.discipline) : null) ||
                (req.body?.discipline ? String(req.body.discipline) : "architectural");

            // 2) Client metadata (optional)
            let clientData = {};
            if (project.applicationId) {
                const cm = await clientMeta.findOne({ applicationId: project.applicationId });
                if (cm) {
                    clientData = {
                        nameAr: cm.emiratesId?.full_name || cm.passport?.full_name || project.ownerName,
                        nameEn: cm.passport?.full_name || cm.emiratesId?.full_name || project.ownerName,
                    };
                }
            }

            // 3) Validation results (optional)
            const valResult = await validationResults.findOne({
                project_id: realProjectId,
                version_number: parseInt(versionNumber, 10),
            });

            // 4) Latest decision (required)
            const decisionDoc = await projectDecisions
                .find({
                    project_id: realProjectId,
                    version_number: parseInt(versionNumber, 10),
                })
                .sort({ created_at: -1 })
                .limit(1)
                .next();

            if (!decisionDoc) {
                return res.status(400).json({ error: "No decision found for this version. Submit decision first." });
            }

            // Allow generating reports for all statuses (Approved, Rejected, Returned)
            // if (decisionDoc.decision !== "approved" && decisionDoc.decision !== "approved_with_conditions") {
            //    return res.status(400).json({ error: "Cannot issue certificate for rejected/returned application." });
            // }

            // 4.5 Check if certificate already exists (Allow Re-generation)
            const existingCert = await certificates.findOne({
                project_id: realProjectId,
                version_number: parseInt(versionNumber, 10)
            });

            // Use existing number if available, else generate new
            let certNum = existingCert?.certificate_number;
            if (!certNum) {
                const count = await certificates.countDocuments();
                const seq = String(count + 1).padStart(5, "0");
                const year = new Date().getFullYear();
                certNum = `CERT-${year}-${seq}`;
            }

            // 5.5) Fetch Structural and Fire Safety Results for multi-disciplinary report
            const db = getDb();
            const structuralGroup = await db.collection('file_groups').findOne({ projectId: projectId, type: 'structural' });
            const fireSafetyGroup = await db.collection('file_groups').findOne({ projectId: projectId, type: 'fire_safety' });

            let structuralResult = null;
            if (structuralGroup) {
                const latestStructural = await db.collection('file_versions').findOne(
                    { group_id: structuralGroup._id.toString() },
                    { sort: { version_number: -1 } }
                );
                structuralResult = latestStructural?.results || null;
            }

            let fireSafetyResult = null;
            if (fireSafetyGroup) {
                const latestFS = await db.collection('file_versions').findOne(
                    { group_id: fireSafetyGroup._id.toString() },
                    { sort: { version_number: -1 } }
                );
                fireSafetyResult = latestFS?.results || null;
            }

            // 6) Prepare PDF data
            const verifyUrl = `${process.env.API_BASE_URL || "http://localhost:8289"}/api/verify/${certNum}`;
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                verifyUrl
            )}`;

            const pdfData = {
                certificateNumber: certNum,
                applicationNo: project.applicationNo || project.applicationId || "N/A",
                generatedAt: new Date().toLocaleDateString("en-GB"),
                ownerNameEn: clientData.nameEn || project.ownerName || "Unknown Owner",
                ownerNameAr: clientData.nameAr || project.ownerName || "Unknown Owner",
                plotNumber: project.plotNo || "N/A",
                sector: project.zone || "N/A",
                city: project.city || "Abu Dhabi",
                decisionType: decisionDoc.decision,
                officerName: req.user.email || "Municipality Officer",
                projectName: project.title || "Project Villa Plan",
                projectType: project.projectType || "Architectural Plan",
                verifyUrl, // Passed for local QR generation
                stats: req.body.stats || valResult?.summary || { total_rules: 0, passed_rules: 0, failed_rules: 0 },
                structuralResult,
                fireSafetyResult,
                architecturalResults: req.body.results || valResult || null
            };

            const { buffer, checksum } = await generateCertificatePdf(pdfData);

            // 7) Write file
            const filename = `${certNum}.pdf`;
            const uploadDir = path.join(__dirname, "../uploads/certificates");
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            fs.writeFileSync(path.join(uploadDir, filename), buffer);

            // 8) Store DB record
            const certRecord = {
                certificate_number: certNum,
                project_id: realProjectId,
                version_number: parseInt(versionNumber, 10),
                discipline,
                pdf_path: `uploads/certificates/${filename}`,
                filename,
                pdf_checksum: checksum,
                decision_snapshot: decisionDoc,
                created_at: new Date(),
                created_by: userId,
            };

            await certificates.updateOne(
                { project_id: realProjectId, version_number: parseInt(versionNumber, 10) },
                { $set: certRecord },
                { upsert: true }
            );

            return res.status(201).json({
                message: "Certificate generated successfully",
                certificateNumber: certNum,
                downloadUrl: `/api/certificates/${certNum}/download`,
                certificate: certRecord,
            });
        } catch (err) {
            console.error("[Projects] Certificate generation error:", err);
            return res.status(500).json({ error: "Internal server error: " + err.message });
        }
    }
);

/** -----------------------------
 * Base CRUD
 * ----------------------------- */

/**
 * POST /api/projects
 * Create a new project
 *
 * If applicationId already exists (stored as _id or applicationNo), update it and increment version.
 */
router.post("/", authMiddleware, async (req, res) => {
    let {
        projectType,
        ownerName,
        consultantName,
        plotNo,
        zone,
        city,
        applicationId, // raw numeric string from frontend
    } = req.body;

    const createdBy = req.user.userId;
    const createdByEmail = req.user.email;

    try {
        const projects = col("projects");
        const clientMetadataCollection = col("client_metadata");

        const rawAppId = applicationId ? String(applicationId).trim() : null;
        let applicationNo = null;

        if (rawAppId) {
            // Validation: must be numeric
            if (!/^\d+$/.test(rawAppId)) {
                return res.status(400).json({ error: "Application number must contain digits only." });
            }
            // Generate Prefixed ID
            const prefix = getPrefix(projectType);
            applicationNo = `${prefix}-${rawAppId}`;
        }

        // Resolve owner name from metadata if exists
        let resolvedOwnerName = ownerName || "";
        if (rawAppId) {
            const clientMeta = await clientMetadataCollection.findOne({ applicationId: rawAppId });
            const clientName = clientMeta?.passport?.full_name || clientMeta?.emiratesId?.full_name || null;
            if (clientName) resolvedOwnerName = clientName;
        }

        // 1. Check if we should update an existing project (by applicationNo or _id)
        let existing = null;
        if (applicationNo) {
            existing = await projects.findOne({
                $or: [{ applicationNo: applicationNo }, { _id: applicationNo }],
                createdBy
            });
        }

        if (existing) {
            const nextVersion = (existing.version || 1) + 1;

            // --- VERSION SNAPSHOT LOGIC ---
            // Archive the CURRENT state to 'project_versions' before overwriting
            await col("project_versions").insertOne({
                project_id: existing._id.toString(),
                version_number: existing.version || 1,
                snapshot_data: { ...existing },
                archived_at: new Date(),
                archived_by: createdBy
            });
            // ------------------------------

            await projects.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        projectType,
                        ownerName: resolvedOwnerName,
                        consultantName,
                        plotNo,
                        zone,
                        city,
                        version: nextVersion,
                        updatedAt: new Date(),
                    },
                    $push: {
                        statusHistory: {
                            status: "Updated",
                            changedBy: createdBy,
                            changedByEmail: createdByEmail,
                            changedAt: new Date(),
                            reason: `Project updated from v${existing.version || 1} to v${nextVersion}`,
                        },
                    },
                }
            );

            const updatedProject = await projects.findOne({ _id: existing._id });

            return res.status(200).json({
                id: updatedProject._id.toString(),
                message: "Project updated successfully",
                project: {
                    id: updatedProject._id.toString(),
                    ...updatedProject,
                    current_version_number: updatedProject.version || 1,
                    createdAt: safeIso(updatedProject.createdAt),
                    updatedAt: safeIso(updatedProject.updatedAt),
                },
            });
        }

        // 2. Uniqueness check for NEW project (prevent VIL-1000 duplicated by someone else or another type)
        if (applicationNo) {
            const conflict = await projects.findOne({ applicationNo });
            if (conflict) {
                return res.status(409).json({
                    error: `Application number already exists: ${applicationNo}`,
                    code: "APP_NO_CONFLICT"
                });
            }
        }

        // 3. New project
        const newId = applicationNo ? applicationNo : new ObjectId().toString();

        const doc = {
            _id: newId,
            applicationNoRaw: rawAppId,
            applicationNo: applicationNo,
            applicationId: rawAppId, // legacy compat
            projectType,
            ownerName: resolvedOwnerName,
            consultantName,
            plotNo,
            zone,
            city,
            version: 1,
            status: "OPEN",
            createdBy,
            createdByEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
            statusHistory: [
                {
                    status: "Created",
                    changedBy: createdBy,
                    changedByEmail: createdByEmail,
                    changedAt: new Date(),
                },
            ],
        };

        const result = await projects.insertOne(doc);

        return res.status(201).json({
            id: newId,
            message: "Project created successfully",
            project: {
                id: newId,
                ...doc,
                current_version_number: 1,
                createdAt: safeIso(doc.createdAt),
                updatedAt: safeIso(doc.updatedAt),
            },
        });
    } catch (err) {
        console.error("[Projects] Create error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/projects/:projectId/versions
 * List project history (snapshots)
 */
router.get("/:projectId/versions", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
        const projects = col("projects");
        const projectVersions = col("project_versions");

        const project = await resolveProject(projects, projectId, userId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const realProjectId = project._id.toString();

        const history = await projectVersions
            .find({ project_id: realProjectId })
            .sort({ version_number: -1 })
            .toArray();

        return res.json({
            current_version: project.version,
            history: history.map(h => ({
                version_number: h.version_number,
                archived_at: h.archived_at,
                snapshot: h.snapshot_data
            }))
        });
    } catch (err) {
        console.error("[Projects] Get versions error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * PATCH /api/projects/:id
 * Update project details (locked projects are blocked by middleware)
 */
router.patch("/:id", authMiddleware, checkProjectLock, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId;

    try {
        const projects = col("projects");

        // Build filter: support ObjectId or string
        const { ObjectId: MongoObjectId } = require("mongodb");
        let filter;
        try {
            filter = { _id: new MongoObjectId(id), createdBy: userId };
        } catch {
            filter = { _id: id, createdBy: userId };
        }

        const { _id, ...safeUpdates } = updates;

        const updateDoc = {
            $set: { ...safeUpdates, updatedAt: new Date() },
        };

        if (updates.status) {
            updateDoc.$push = {
                statusHistory: {
                    status: updates.status,
                    changedBy: userId,
                    changedByEmail: req.user.email,
                    changedAt: new Date(),
                    reason: updates.reason || "Status updated",
                },
            };
            if (updateDoc.$set.reason) delete updateDoc.$set.reason;
        }

        const r = await projects.updateOne(filter, updateDoc);
        if (r.matchedCount === 0) return res.status(404).json({ error: "Project not found or unauthorized" });

        return res.json({ message: "Project updated successfully" });
    } catch (err) {
        console.error("[Projects] Update error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/projects/:id
 * Get project details (supports ObjectId / string id / applicationId)
 */
router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const projects = col("projects");
        const project = await resolveProject(projects, id, userId);

        if (!project) return res.status(404).json({ error: "Project not found" });

        return res.json({
            id: project._id.toString(),
            ...project,
            current_version_number: project.version || 1,
            createdAt: safeIso(project.createdAt),
            updatedAt: safeIso(project.updatedAt),
        });
    } catch (err) {
        console.error("[Projects] Get error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;