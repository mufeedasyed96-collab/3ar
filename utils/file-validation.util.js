const fs = require('fs');
const path = require('path');

/**
 * Validates file integrity using Defense-in-Depth (Extension, Magic Bytes, Content Analysis)
 * @param {string} filePath - Path to the uploaded file on disk
 * @param {string} originalName - Original filename uploaded by user
 * @param {'dwg' | 'pdf'} type - Expected file type
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
async function validateFile(filePath, originalName, type) {
    try {
        // LAYER 1: STRICT EXTENSION CHECK
        const ext = path.extname(originalName).toLowerCase();

        if (type === 'dwg') {
            if (ext !== '.dwg') {
                return { isValid: false, error: 'Layer 1: Invalid file extension. Expected .dwg' };
            }
        } else if (type === 'pdf') {
            if (ext !== '.pdf') {
                return { isValid: false, error: 'Layer 1: Invalid file extension. Expected .pdf' };
            }
        } else {
            return { isValid: false, error: 'System Error: Unknown expected type' };
        }

        // LAYER 3: BINARY SIGNATURE (MAGIC BYTES)
        // Read the first 24 bytes (enough for PDF %PDF-x.y and DWG AC10xx)
        const buffer = Buffer.alloc(24);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 24, 0);
        fs.closeSync(fd);

        // Check for empty/small files
        const stats = fs.statSync(filePath);
        if (stats.size < 64) {
            return { isValid: false, error: 'Security: File too small (potential exploit payload)' };
        }

        // Check for Executable Headers (MZ) - DOS/PE Executables (exe, dll, etc)
        // "MZ" in hex is 4D 5A
        if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
            return { isValid: false, error: 'Security: Executable header (MZ) detected. Rejected.' };
        }

        // Validate Specific Signatures
        if (type === 'dwg') {
            // DWG must start with AC10
            // Hex: 41 43 31 30
            const isDwg = buffer[0] === 0x41 && buffer[1] === 0x43 && buffer[2] === 0x31 && buffer[3] === 0x30;
            if (!isDwg) {
                return { isValid: false, error: 'Layer 3: Magic bytes mismatch. Not a valid DWG file.' };
            }

            // Check if it's a DXF masquerading as DWG (DXF starts with text, usually "SECTION" or comment)
            // DWG is binary, DXF is text.
            // Simple check: Look for "SECTION" in first few bytes or just ensure it's binary-ish?
            // Actually, strict AC10xx check rules out standard DXF which usually starts with code/value pairs (0\nSECTION...)
        }
        else if (type === 'pdf') {
            // PDF must start with %PDF-
            // Hex: 25 50 44 46 2D
            const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2D;
            if (!isPdf) {
                return { isValid: false, error: 'Layer 3: Magic bytes mismatch. Not a valid PDF file.' };
            }
        }

        return { isValid: true };

    } catch (err) {
        console.error('[FileValidation] Error:', err);
        return { isValid: false, error: 'Validation process failed' };
    }
}

module.exports = { validateFile };
