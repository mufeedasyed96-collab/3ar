/**
 * Validation Routes
 * Routes for DWG/PDF validation and compliance checking
 */

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { checkProjectLock } = require("../middleware/lock.middleware");
const { uploadDwg, uploadPdf } = require("../config/multer.config");
const {
    pdfCompliance,
    validateJson,
    validateFull,
    validateDwg,
    getConfig,
    healthCheck,
} = require("../controllers/validation.controller");

// PDF Compliance - proxy to n8n webhook
router.post("/pdf-compliance", uploadPdf.single("file"), pdfCompliance);

// Validate JSON from elements or file path
router.post("/validate", validateJson);

// Full validation with summary
router.post("/validate-full", validateFull);

// DWG upload + versioning + validation (protected)
router.post("/validate-dwg", authMiddleware, checkProjectLock, uploadDwg.single("dwg"), validateDwg);

// Get validation config
router.get("/config", getConfig);

// Health check
router.get("/health", healthCheck);

module.exports = router;
