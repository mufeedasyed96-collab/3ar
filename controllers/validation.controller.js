/**
 * Validation Controller
 * Handles DWG/PDF validation and compliance checking
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");

const { getDb } = require("../database");
const { validateFile } = require("../utils/file-validation.util");
const { spawnPython, spawnPythonJson, ODA_PATH } = require("../utils/python.util");
const { sanitizeName } = require("../config/multer.config");

// Streaming SHA256 (memory efficient)
async function sha256File(filePath) {
    return new Promise((resolve, reject) => {
        const h = crypto.createHash("sha256");
        const s = fs.createReadStream(filePath);
        s.on("error", reject);
        s.on("data", (d) => h.update(d));
        s.on("end", () => resolve(h.digest("hex")));
    });
}

// Per-version artifact directory (prevents collisions)
function artifactDir({ projectId, groupType, versionNumber }) {
    const safeProj = String(projectId).replace(/[^a-zA-Z0-9]/g, "");
    const safeType = String(groupType).replace(/[^a-zA-Z0-9_]/g, "");
    return path.join(__dirname, "..", "artifacts", safeProj, safeType, `v${versionNumber}`);
}

/**
 * PDF Compliance - Proxy to n8n webhook
 */
async function pdfCompliance(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded (field "file")' });

    const pdfPath = req.file.path;

    const validCheck = await validateFile(pdfPath, req.file.originalname, "pdf");
    if (!validCheck.isValid) {
        try { fs.unlinkSync(pdfPath); } catch { }
        return res.status(400).json({ error: validCheck.error });
    }

    const webhookTestUrl = "https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance";
    const webhookProdUrl = "https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance";

    const mode =
        (process.env.PDF_COMPLIANCE_WEBHOOK_MODE || "").toLowerCase() ||
        (process.env.NODE_ENV === "production" ? "prod" : "test");

    const webhookUrl =
        process.env.PDF_COMPLIANCE_WEBHOOK_URL ||
        (mode === "prod" ? webhookProdUrl : webhookTestUrl);

    try {
        const form = new FormData();
        form.append("file", fs.createReadStream(pdfPath), {
            filename: req.file.originalname,
            contentType: req.file.mimetype || "application/pdf",
        });

        const response = await axios.post(webhookUrl, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 5 * 60 * 1000,
            validateStatus: () => true,
        });

        if (response.status < 200 || response.status >= 300) {
            return res.status(502).json({
                error: `Webhook returned ${response.status}`,
                details: response.data,
            });
        }

        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message || "Webhook call failed" });
    } finally {
        try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch { }
    }
}

/**
 * Validate JSON - from elements or json_path
 */
async function validateJson(req, res) {
    try {
        const cli = path.join(__dirname, "..", "python-core", "cli_validate_json.py");

        let validationResult;
        if (req.body.elements) {
            const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
            const out = await spawnPythonJson({
                scriptPath: cli,
                args: ["--stdin"],
                cwd: path.join(__dirname, "..", "python-core"),
                stdinJson: payload,
                timeoutMs: 5 * 60 * 1000,
            });
            validationResult = out.json;
        } else if (req.body.json_path) {
            const out = await spawnPythonJson({
                scriptPath: cli,
                args: ["--elements-json", req.body.json_path],
                cwd: path.join(__dirname, "..", "python-core"),
                timeoutMs: 5 * 60 * 1000,
            });
            validationResult = out.json;
        } else {
            return res.status(400).json({ error: 'Either "json_path" or "elements" required' });
        }

        res.json({
            schema_pass: validationResult.schema_pass,
            article_11_results: validationResult.article_11_results || [],
        });
    } catch (error) {
        res.status(500).json({ error: error.message, schema_pass: false, article_11_results: [] });
    }
}

/**
 * Validate Full - complete validation with summary
 */
async function validateFull(req, res) {
    try {
        const cli = path.join(__dirname, "..", "python-core", "cli_validate_json.py");

        let validationResult;
        if (req.body.elements) {
            const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
            const out = await spawnPythonJson({
                scriptPath: cli,
                args: ["--stdin"],
                cwd: path.join(__dirname, "..", "python-core"),
                stdinJson: payload,
                timeoutMs: 10 * 60 * 1000,
            });
            validationResult = out.json;
        } else if (req.body.json_path) {
            const out = await spawnPythonJson({
                scriptPath: cli,
                args: ["--elements-json", req.body.json_path],
                cwd: path.join(__dirname, "..", "python-core"),
                timeoutMs: 10 * 60 * 1000,
            });
            validationResult = out.json;
        } else {
            return res.status(400).json({ error: 'Either "json_path" or "elements" required' });
        }

        res.json(validationResult);
    } catch (error) {
        res.status(500).json({ error: error.message, schema_pass: false, summary: null, element_results: [] });
    }
}

/**
 * Validate DWG - Municipality-grade upload + versioning + validation
 */
async function validateDwg(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No DWG uploaded (field "dwg")' });
    }

    const tempPath = req.file.path;
    const originalName = req.file.originalname;
    const userId = req.user.userId;
    const userEmail = req.user.email;

    let projectId = req.body.projectId || null;
    const groupType = req.body.fileType || "villa_plan";

    const db = getDb();
    if (!db) {
        try { fs.unlinkSync(tempPath); } catch { }
        return res.status(500).json({ error: "Database connection failed" });
    }

    // Security validation for DWG
    const dwgCheck = await validateFile(tempPath, originalName, "dwg");
    if (!dwgCheck.isValid) {
        try { fs.unlinkSync(tempPath); } catch { }
        return res.status(400).json({ error: dwgCheck.error });
    }

    let versionDoc = null;
    let groupDoc = null;
    let finalDwgPath = null;

    const session = db.client?.startSession ? db.client.startSession() : null;

    try {
        // Resolve or create project
        if (!projectId) {
            const projectsColl = db.collection("projects");

            const existing = await projectsColl.findOne({
                createdBy: userId,
                sourceFilename: originalName,
            });

            if (existing) {
                projectId = existing._id.toString();
            } else {
                const newProject = {
                    projectType: "Villa",
                    ownerName: req.body.ownerName || "Auto-Created",
                    consultantName: "Auto-Created",
                    title: originalName,
                    sourceFilename: originalName,
                    status: "New",
                    statusHistory: [
                        {
                            status: "New",
                            changedBy: userId,
                            changedByEmail: userEmail,
                            changedAt: new Date(),
                            reason: "Project auto-created from upload",
                        },
                    ],
                    createdBy: userId,
                    createdByEmail: userEmail,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const pr = await projectsColl.insertOne(newProject);
                projectId = pr.insertedId.toString();
            }
        }

        // Atomic versioning
        const fileGroups = db.collection("file_groups");
        const fileVersions = db.collection("file_versions");
        const historyColl = db.collection("history");

        const runInTx = async (fn) => {
            if (!session) return fn();
            return session.withTransaction(fn, {
                readConcern: { level: "majority" },
                writeConcern: { w: "majority" },
            });
        };

        await runInTx(async () => {
            // Find or create File Group
            const gr = await fileGroups.findOneAndUpdate(
                { projectId, type: groupType },
                {
                    $setOnInsert: {
                        projectId,
                        type: groupType,
                        current_version: 0,
                        status: "draft",
                        created_at: new Date(),
                        createdBy: userId,
                    },
                    $set: { updated_at: new Date() },
                },
                { upsert: true, returnDocument: "after", session: session || undefined }
            );

            groupDoc = gr.value || gr;
            if (!groupDoc || !groupDoc._id) throw new Error("Failed to resolve file group");

            // Reserve next version
            const inc = await fileGroups.findOneAndUpdate(
                { _id: groupDoc._id },
                { $inc: { current_version: 1 }, $set: { updated_at: new Date() } },
                { returnDocument: "after", session: session || undefined }
            );

            const updatedGroup = inc.value || inc;
            const nextVersion = updatedGroup.current_version;

            // Move DWG into immutable per-version folder
            const dir = artifactDir({ projectId, groupType, versionNumber: nextVersion });
            await fsp.mkdir(dir, { recursive: true });

            const ext = path.extname(originalName || ".dwg") || ".dwg";
            const ts = Date.now();
            const immutableName = `${sanitizeName(projectId)}_${sanitizeName(groupType)}_v${nextVersion}_${ts}${ext}`;
            finalDwgPath = path.join(dir, immutableName);

            fs.renameSync(tempPath, finalDwgPath);

            // Hash
            const fileHash = await sha256File(finalDwgPath);

            // Insert version record
            const vDoc = {
                group_id: groupDoc._id.toString(),
                project_id: projectId,
                version_number: nextVersion,
                file_metadata: {
                    original_name: originalName,
                    stored_filename: immutableName,
                    size_bytes: req.file.size,
                    mime_type: req.file.mimetype,
                    hash_sha256: fileHash,
                },
                uploaded_by: {
                    user_id: userId,
                    email: userEmail,
                },
                upload_reason: req.body.uploadReason || "Upload",
                is_active: true,
                processing_status: "queued",
                created_at: new Date(),
            };

            // Deactivate old active versions
            await fileVersions.updateMany(
                { group_id: groupDoc._id.toString(), is_active: true },
                { $set: { is_active: false } },
                { session: session || undefined }
            );

            const vr = await fileVersions.insertOne(vDoc, { session: session || undefined });
            versionDoc = { ...vDoc, _id: vr.insertedId };

            await historyColl.insertOne(
                {
                    action: "UPLOAD_VERSION",
                    projectId,
                    groupId: groupDoc._id.toString(),
                    versionId: vr.insertedId.toString(),
                    versionNumber: nextVersion,
                    userId,
                    timestamp: new Date(),
                },
                { session: session || undefined }
            );
        });

        // Processing / Validation (outside transaction)
        await db.collection("file_versions").updateOne(
            { _id: versionDoc._id },
            { $set: { processing_status: "processing" } }
        );

        if (!fs.existsSync(ODA_PATH)) throw new Error(`ODA converter not found: ${ODA_PATH}`);

        const vDir = artifactDir({
            projectId,
            groupType,
            versionNumber: versionDoc.version_number,
        });

        // DWG -> DXF conversion
        const dwgConverterScript = path.join(__dirname, "..", "python-core", "dwg_converter.py");
        const conv = await spawnPython({
            scriptPath: dwgConverterScript,
            args: [ODA_PATH, finalDwgPath, vDir],
            cwd: path.join(__dirname, ".."),
            timeoutMs: 10 * 60 * 1000,
        });

        if (!conv.success) {
            await db.collection("file_versions").updateOne(
                { _id: versionDoc._id },
                { $set: { processing_status: "failed", processing_error: conv.stderr || conv.stdout } }
            );
            throw new Error(`DWG->DXF conversion failed: ${conv.stderr || conv.stdout || ""}`);
        }

        // Locate newest DXF in vDir
        const dxfs = fs
            .readdirSync(vDir)
            .filter((f) => f.toLowerCase().endsWith(".dxf"))
            .map((f) => ({ p: path.join(vDir, f), m: fs.statSync(path.join(vDir, f)).mtimeMs }))
            .sort((a, b) => b.m - a.m);
        if (!dxfs.length) throw new Error("No DXF produced by conversion");

        const dxfPath = dxfs[0].p;

        // Validate
        const standaloneCli = path.join(__dirname, "..", "python-core", "cli_validate_json.py");
        const out = await spawnPythonJson({
            scriptPath: standaloneCli,
            args: ["--dxf", dxfPath],
            cwd: path.join(__dirname, "..", "python-core"),
            timeoutMs: 15 * 60 * 1000,
        });

        const validationResult = out.json || {};

        // Save validation result
        const valRes = await db.collection("validation_results").insertOne({
            file_version_id: versionDoc._id.toString(),
            project_id: projectId,
            group_id: versionDoc.group_id,
            version_number: versionDoc.version_number,
            summary: validationResult.summary || null,
            schema_pass: validationResult.schema_pass ?? null,
            payload: validationResult,
            run_at: new Date(),
        });

        // Link validation to version
        await db.collection("file_versions").updateOne(
            { _id: versionDoc._id },
            {
                $set: {
                    processing_status: "done",
                    latest_validation_result_id: valRes.insertedId.toString(),
                    artifacts: {
                        dwg_path: finalDwgPath,
                        dxf_path: dxfPath,
                        artifact_dir: vDir,
                    },
                },
            }
        );

        return res.json({
            ...validationResult,
            project_id: projectId,
            file_group_type: groupType,
            file_version: versionDoc.version_number,
            file_version_id: versionDoc._id.toString(),
            validation_result_id: valRes.insertedId.toString(),
        });
    } catch (error) {
        console.error("[validate-dwg] ERROR:", error);

        try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch { }

        try {
            if (versionDoc?._id) {
                await db.collection("file_versions").updateOne(
                    { _id: versionDoc._id },
                    { $set: { processing_status: "failed", processing_error: error.message } }
                );
            }
        } catch { }

        return res.status(500).json({
            error: error.message,
            schema_pass: false,
            element_results: [],
            file_version_id: versionDoc?._id ? versionDoc._id.toString() : null,
        });
    } finally {
        try { if (session) session.endSession(); } catch { }
    }
}

/**
 * Get Config - Returns validation configuration
 */
async function getConfig(req, res) {
    try {
        const script = path.join(__dirname, "..", "python-core", "cli_dump_config_json.py");
        const out = await spawnPythonJson({
            scriptPath: script,
            args: [],
            cwd: path.join(__dirname, "..", "python-core"),
            timeoutMs: 60 * 1000,
        });
        return res.json(out.json);
    } catch (error) {
        return res.status(500).json({ error: error.message, status: "error" });
    }
}

/**
 * Health Check
 */
function healthCheck(req, res) {
    res.json({ status: "ok", service: "Architectural Schema Validator", version: "1.0.0" });
}

module.exports = {
    pdfCompliance,
    validateJson,
    validateFull,
    validateDwg,
    getConfig,
    healthCheck,
};
