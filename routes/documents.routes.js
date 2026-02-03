/**
 * Documents Routes
 * Routes for passport and Emirates ID parsing
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { parsePassport, parseEmiratesID } = require("../controllers/documents.controller");

// Use the same uploads directory
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const base = path.basename(file.originalname || "doc", ext).replace(/[^\w.\-]+/g, "_").slice(0, 100);
        cb(null, `${base}_${Date.now()}${ext}`);
    },
});

// Passport uploader - accepts PDF and images
const uploadPassport = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const ext = (file.originalname || "").toLowerCase();
        const okPdf = ext.endsWith(".pdf");
        const okImg = ext.endsWith(".jpg") || ext.endsWith(".jpeg") || ext.endsWith(".png");
        if (okPdf || okImg) return cb(null, true);
        cb(new Error("Passport accepts PDF, JPG, or PNG files only"), false);
    },
});

// EID uploader - accepts PDF only
const uploadEID = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const ext = (file.originalname || "").toLowerCase();
        if (ext.endsWith(".pdf")) return cb(null, true);
        cb(new Error("Emirates ID accepts PDF files only"), false);
    },
});

// Routes
router.post("/parse-passport", uploadPassport.single("file"), parsePassport);
router.post("/parse-eid", uploadEID.single("file"), parseEmiratesID);

module.exports = router;
