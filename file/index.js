/**
 * ============================================================================
 * Passport OCR - Main Processing Module
 * ============================================================================
 * 
 * ❗ IMPORTANT UI RULE:
 * ❗ Never display raw MRZ names in UI.
 * ❗ Always display normalized full_name.
 * 
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, performOCR } = require('./ocr-engine');
const { parseMRZ: parseMRZNew } = require('./mrz-parser');
const { parseVisual } = require('./parser-engine');
const { normalizeMrzName, getNationality, toTitleCase } = require('./mrz-parser');

/**
 * Main function to process a passport document.
 * Returns structured JSON with full_name, surname, given_names, nationality, etc.
 * 
 * @param {string} filePath - Path to the passport file (PDF or image)
 * @returns {Promise<object>} - Extracted passport data
 */
async function processPassport(filePath) {
    const warnings = [];

    if (!fs.existsSync(filePath)) {
        return { error: 'File not found', warnings: ['File does not exist'] };
    }

    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    try {
        // Step 1: Extract text from document
        if (ext === '.pdf') {
            text = await extractTextFromPDF(filePath);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            text = await performOCR(filePath);
        } else {
            return { error: 'Unsupported file type', warnings: ['Please provide a PDF or image'] };
        }

        // Step 2: Try MRZ parsing first (high accuracy)
        let result = parseMRZNew(text);

        // Step 3: Fallback to visual parsing if MRZ fails
        if (!result || !result.full_name) {
            warnings.push('MRZ not detected, using visual text extraction');

            const visualResult = parseVisual(text);

            if (visualResult && visualResult.name) {
                // Convert visual result to new format
                const nameParts = visualResult.name.split(' ');
                const givenNames = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
                const surname = nameParts.slice(-1)[0] || '';

                const natCode = visualResult.nationality || '';
                const natInfo = getNationality(natCode);

                result = {
                    full_name: toTitleCase(visualResult.name),
                    surname: toTitleCase(surname),
                    given_names: toTitleCase(givenNames),
                    nationality_code: natInfo.code,
                    nationality: natInfo.name,
                    data_source: 'Visual',
                    warnings: warnings
                };
            } else {
                return {
                    error: 'Could not extract passport data',
                    warnings: ['No MRZ or visual text detected']
                };
            }
        } else {
            // Add any MRZ warnings to our warnings array
            if (result.warnings) {
                warnings.push(...result.warnings);
            }
            result.warnings = warnings;
        }

        // Remove debug field before returning
        delete result.mrz_raw_name_field;

        return result;

    } catch (error) {
        console.error('Error processing document:', error);
        return { error: error.message, warnings: ['Processing error occurred'] };
    }
}

// CLI usage
const args = process.argv.slice(2);
if (args.length > 0) {
    processPassport(path.resolve(args[0])).then(result => {
        console.log(JSON.stringify(result, null, 2));
    });
}

// Always export for module use
module.exports = { processPassport };
