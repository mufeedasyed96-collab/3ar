/**
 * ============================================================================
 * Emirates ID Processor - Main Module
 * ============================================================================
 * 
 * Extracts data from Emirates ID cards:
 * - Full Name
 * - Nationality
 * - EID Number
 * 
 * Usage:
 *   node eid-index.js <path-to-eid-file>
 * 
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, performOCR } = require('./ocr-engine');
const { parseEmiratesID } = require('./eid-parser');

/**
 * Process an Emirates ID document.
 * 
 * @param {string} filePath - Path to the EID file (PDF or image)
 * @returns {Promise<object>} - Extracted EID data
 */
async function processEmiratesID(filePath) {
    const warnings = [];

    if (!fs.existsSync(filePath)) {
        return { error: 'File not found', warnings: ['File does not exist'] };
    }

    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    try {
        // Extract text via OCR
        if (ext === '.pdf') {
            text = await extractTextFromPDF(filePath);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            text = await performOCR(filePath);
        } else {
            return { error: 'Unsupported file type', warnings: ['Please provide a PDF or image'] };
        }

        // Parse the Emirates ID
        const result = parseEmiratesID(text);

        return result;

    } catch (error) {
        console.error('Error processing Emirates ID:', error);
        return { error: error.message, warnings: ['Processing error occurred'] };
    }
}

// CLI usage
const args = process.argv.slice(2);
if (args.length > 0) {
    processEmiratesID(path.resolve(args[0])).then(result => {
        console.log(JSON.stringify(result, null, 2));
    });
}

module.exports = { processEmiratesID };
