/**
 * Documents Controller
 * Handles passport and Emirates ID parsing
 */

const fs = require("fs");
const path = require("path");

// Import parsing functions from file/ folder
const { processPassport } = require("../file/index");
const { processEmiratesID } = require("../file/eid-index");

/**
 * Parse Passport (PDF or Image)
 * POST /api/documents/parse-passport
 */
async function parsePassport(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded (field "file")' });
    }

    const filePath = req.file.path;

    try {
        console.log(`[Documents] Parsing passport: ${req.file.originalname}`);

        const result = await processPassport(filePath);

        if (result.error) {
            return res.status(400).json(result);
        }

        return res.json({
            success: true,
            data: result,
            file_name: req.file.originalname,
        });
    } catch (error) {
        console.error("[Documents] Passport parsing error:", error);
        return res.status(500).json({
            error: error.message || "Failed to parse passport",
            warnings: ["Processing error occurred"],
        });
    } finally {
        // Cleanup uploaded file after processing
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            console.warn("[Documents] Could not delete temp file:", e.message);
        }
    }
}

/**
 * Parse Emirates ID (PDF only)
 * POST /api/documents/parse-eid
 */
async function parseEmiratesID(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded (field "file")' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // EID only accepts PDF
    if (ext !== ".pdf") {
        try { fs.unlinkSync(filePath); } catch { }
        return res.status(400).json({
            error: "Emirates ID only accepts PDF files",
            warnings: ["Please upload a PDF file"],
        });
    }

    try {
        console.log(`[Documents] Parsing Emirates ID: ${req.file.originalname}`);

        const result = await processEmiratesID(filePath);

        if (result.error) {
            return res.status(400).json(result);
        }

        return res.json({
            success: true,
            data: result,
            file_name: req.file.originalname,
        });
    } catch (error) {
        console.error("[Documents] EID parsing error:", error);
        return res.status(500).json({
            error: error.message || "Failed to parse Emirates ID",
            warnings: ["Processing error occurred"],
        });
    } finally {
        // Cleanup uploaded file after processing
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            console.warn("[Documents] Could not delete temp file:", e.message);
        }
    }
}

module.exports = {
    parsePassport,
    parseEmiratesID,
};
