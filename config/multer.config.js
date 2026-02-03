/**
 * Multer Configuration
 * File upload handling for DWG and PDF files
 */

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function sanitizeName(name) {
    return String(name || "")
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 200);
}

// TEMP upload filename (will be renamed to versioned immutable name later)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const base = path.basename(file.originalname || "file", ext);
        const safe = sanitizeName(base);
        cb(null, `${safe}_${Date.now()}${ext || ""}`);
    },
});

// DWG uploader
const uploadDwg = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const okExt = (file.originalname || "").toLowerCase().endsWith(".dwg");
        const okMime =
            file.mimetype === "application/acad" ||
            file.mimetype === "application/x-autocad" ||
            file.mimetype === "application/octet-stream";
        if (okExt || okMime) return cb(null, true);
        cb(new Error("Only DWG files are allowed"), false);
    },
});

// PDF uploader
const uploadPdf = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const okExt = (file.originalname || "").toLowerCase().endsWith(".pdf");
        const okMime = file.mimetype === "application/pdf";
        if (okExt || okMime) return cb(null, true);
        cb(new Error("Only PDF files are allowed"), false);
    },
});

module.exports = {
    uploadsDir,
    sanitizeName,
    uploadDwg,
    uploadPdf,
};
