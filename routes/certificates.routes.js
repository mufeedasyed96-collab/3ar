// const express = require('express');
// const router = express.Router();
// const { getDb } = require('../database');
// const authMiddleware = require('../middleware/auth.middleware');

// // Helper to get collection
// const getCol = (name) => getDb().collection(name);

// /**
//  * GET /api/certificates/:certificateNumber/download
//  * Download the PDF
//  */
// router.get('/certificates/:certificateNumber/download', authMiddleware, async (req, res) => {
//     const { certificateNumber } = req.params;

//     try {
//         const certificates = getCol('certificates');
//         const cert = await certificates.findOne({ certificate_number: certificateNumber });

//         if (!cert) return res.status(404).json({ error: 'Certificate not found' });

//         const path = require('path');
//         // Resolve absolute path
//         const filePath = path.resolve(__dirname, '..', cert.pdf_path);

//         res.download(filePath, `${certificateNumber}.pdf`);

//     } catch (error) {
//         console.error('Download Error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// /**
//  * GET /api/verify/:certificateNumber
//  * Public verification endpoint
//  */
// router.get('/verify/:certificateNumber', async (req, res) => {
//     const { certificateNumber } = req.params;

//     try {
//         const certificates = getCol('certificates');
//         const cert = await certificates.findOne({ certificate_number: certificateNumber });

//         if (!cert) return res.status(404).json({ valid: false, error: 'Certificate not found' });

//         res.json({
//             valid: true,
//             certificate_number: cert.certificate_number,
//             project_id: cert.project_id,
//             decision: cert.decision_snapshot.type,
//             date: cert.created_at,
//             checksum: cert.pdf_checksum
//         });

//     } catch (error) {
//         res.status(500).json({ error: 'Verification error' });
//     }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");

const { getDb } = require("../database");
const authMiddleware = require("../middleware/auth.middleware");

// Helper to get collection
const getCol = (name) => getDb().collection(name);

function nowIso() {
    return new Date().toISOString();
}

function safeDiscipline(input) {
    const d = String(input || "architectural");
    // keep consistent with frontend: "architectural" | "structural" | "fireSafety"
    if (d === "structural") return "structural";
    if (d === "fireSafety") return "fireSafety";
    return "architectural";
}

function makeCertificateNumber(projectId, version, discipline) {
    // simple stable number. you can change format later.
    const stamp = Date.now();
    return `CERT-${projectId}-${version}-${discipline}-${stamp}`;
}

/**
 * =============================================================================
 * 1) GET latest certificate by project + discipline
 * GET /api/projects/:projectId/certificate?discipline=architectural
 * =============================================================================
 */
router.get(
    "/projects/:projectId/certificate",
    authMiddleware,
    async (req, res) => {
        const { projectId } = req.params;
        const discipline = safeDiscipline(req.query.discipline);

        try {
            const certificates = getCol("certificates");

            const cert = await certificates.findOne(
                { project_id: projectId, discipline },
                { sort: { created_at: -1 } }
            );

            if (!cert) return res.status(404).json({ error: "Certificate not found" });

            return res.json({
                certificate_number: cert.certificate_number,
                project_id: cert.project_id,
                version_number: cert.version_number,
                discipline: cert.discipline,
                decision: cert.decision_snapshot,
                generated_at: cert.created_at,
                download_url: `/api/certificates/${cert.certificate_number}/download`,
                filename: `${cert.certificate_number}.pdf`,
            });
        } catch (error) {
            console.error("[Certificate] get latest error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * =============================================================================
 * 2) POST decision snapshot for a version + discipline
 * POST /api/projects/:projectId/versions/:version/decision
 * Body:
 * {
 *   "discipline": "architectural",
 *   "decision": { "type": "approved" | "rejected" | "approved_with_conditions", ... }
 * }
 * =============================================================================
 */
router.post(
    "/projects/:projectId/versions/:version/decision",
    authMiddleware,
    async (req, res) => {
        const { projectId, version } = req.params;
        const discipline = safeDiscipline(req.body?.discipline);
        const decision = req.body?.decision;

        if (!decision?.type) {
            return res.status(400).json({
                error: "Missing decision.type (approved/rejected/approved_with_conditions)",
            });
        }

        try {
            const decisions = getCol("project_decisions");

            // Upsert decision per project/version/discipline
            await decisions.updateOne(
                { project_id: projectId, version_number: Number(version), discipline },
                {
                    $set: {
                        project_id: projectId,
                        version_number: Number(version),
                        discipline,
                        decision,
                        updated_at: nowIso(),
                    },
                    $setOnInsert: { created_at: nowIso() },
                },
                { upsert: true }
            );

            return res.json({
                ok: true,
                project_id: projectId,
                version_number: Number(version),
                discipline,
                decision,
            });
        } catch (error) {
            console.error("[Decision] submit error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * =============================================================================
 * 3) POST generate certificate for project version
 * POST /api/projects/:projectId/versions/:version/certificate?discipline=architectural
 *
 * NOTE: This creates a DB record and (optionally) points to an existing PDF path.
 * If you don't generate PDFs yet, keep pdf_path null and return JSON.
 * =============================================================================
 */
router.post(
    "/projects/:projectId/versions/:version/certificate",
    authMiddleware,
    async (req, res) => {
        const { projectId, version } = req.params;
        const discipline = safeDiscipline(req.query.discipline);

        try {
            const certificates = getCol("certificates");
            const decisions = getCol("project_decisions");

            // must have a decision first
            const decisionRow = await decisions.findOne({
                project_id: projectId,
                version_number: Number(version),
                discipline,
            });

            if (!decisionRow?.decision?.type) {
                return res.status(400).json({
                    error:
                        "Decision not found. Submit decision first: POST /api/projects/:projectId/versions/:version/decision",
                });
            }

            // In real system, you generate a PDF and store path.
            // For now: store a placeholder path if you already have a template output.
            const certificateNumber = makeCertificateNumber(
                projectId,
                version,
                discipline
            );

            const createdAt = nowIso();

            // Optional: create a dummy file checksum (replace with real PDF checksum)
            const checksum = crypto
                .createHash("sha256")
                .update(`${certificateNumber}-${createdAt}`)
                .digest("hex");

            const certDoc = {
                certificate_number: certificateNumber,
                project_id: projectId,
                version_number: Number(version),
                discipline,
                decision_snapshot: decisionRow.decision,
                created_at: createdAt,
                // IMPORTANT: set this only when you have a real PDF generated
                pdf_path: null,
                pdf_checksum: checksum,
            };

            await certificates.insertOne(certDoc);

            return res.json({
                certificate_number: certDoc.certificate_number,
                project_id: certDoc.project_id,
                version_number: certDoc.version_number,
                discipline: certDoc.discipline,
                decision: certDoc.decision_snapshot,
                generated_at: certDoc.created_at,
                download_url: `/api/certificates/${certDoc.certificate_number}/download`,
                filename: `${certDoc.certificate_number}.pdf`,
            });
        } catch (error) {
            console.error("[Certificate] generate error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * =============================================================================
 * 4) GET download latest certificate by project + discipline
 * GET /api/projects/:projectId/certificate/download?discipline=architectural
 * =============================================================================
 */
router.get(
    "/projects/:projectId/certificate/download",
    authMiddleware,
    async (req, res) => {
        const { projectId } = req.params;
        const discipline = safeDiscipline(req.query.discipline);

        try {
            const certificates = getCol("certificates");
            const cert = await certificates.findOne(
                { project_id: projectId, discipline },
                { sort: { created_at: -1 } }
            );

            if (!cert) return res.status(404).json({ error: "Certificate not found" });

            if (!cert.pdf_path) {
                return res.status(400).json({
                    error:
                        "Certificate exists but pdf_path is not generated yet. Implement PDF generation and store pdf_path.",
                });
            }

            const filePath = path.resolve(__dirname, "..", cert.pdf_path);
            return res.download(filePath, `${cert.certificate_number}.pdf`);
        } catch (error) {
            console.error("[Certificate] download latest error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * =============================================================================
 * Existing endpoint (keep)
 * GET /api/certificates/:certificateNumber/download
 * Download the PDF by certificate number
 * =============================================================================
 */
router.get(
    "/certificates/:certificateNumber/download",
    authMiddleware,
    async (req, res) => {
        const { certificateNumber } = req.params;

        try {
            const certificates = getCol("certificates");
            const cert = await certificates.findOne({
                certificate_number: certificateNumber,
            });

            if (!cert) return res.status(404).json({ error: "Certificate not found" });

            if (!cert.pdf_path) {
                return res.status(400).json({
                    error:
                        "Certificate exists but pdf_path is not generated yet. Implement PDF generation and store pdf_path.",
                });
            }

            const filePath = path.resolve(__dirname, "..", cert.pdf_path);
            return res.download(filePath, `${certificateNumber}.pdf`);
        } catch (error) {
            console.error("Download Error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * Existing public verification (keep)
 * GET /api/verify/:certificateNumber
 */
router.get("/verify/:certificateNumber", async (req, res) => {
    const { certificateNumber } = req.params;

    try {
        const certificates = getCol("certificates");
        const cert = await certificates.findOne({
            certificate_number: certificateNumber,
        });

        if (!cert) return res.status(404).json({ valid: false, error: "Certificate not found" });

        return res.json({
            valid: true,
            certificate_number: cert.certificate_number,
            project_id: cert.project_id,
            decision: cert.decision_snapshot?.type,
            date: cert.created_at,
            checksum: cert.pdf_checksum,
        });
    } catch (error) {
        return res.status(500).json({ error: "Verification error" });
    }
});

module.exports = router;