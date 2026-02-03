/**
 * ============================================================================
 * Passport Processor - Main Processing Pipeline
 * ============================================================================
 * 
 * Orchestrates the passport data extraction pipeline:
 * 1. Image preprocessing (PDF/Image normalization)
 * 2. OCR extraction
 * 3. MRZ parsing (primary source)
 * 4. Visual fallback (if MRZ fails)
 * 5. Name normalization and cleanup
 * 
 * Output: full_name, surname, given_names, nationality, country_code
 * 
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { parseMRZ } = require('./mrz-parser');
const { getCountryName } = require('./country-codes');
const { normalizeName, parseAndNormalizeName } = require('./name-normalizer');

// Import OCR engine from parent directory
const { extractTextFromPDF, performOCR } = require('../ocr-engine');

/**
 * Process a passport document and extract key fields.
 * 
 * @param {string} filePath - Path to passport file (PDF/JPG/PNG)
 * @param {object} options - Processing options
 * @param {boolean} options.debug - Include debug info in response
 * @returns {Promise<object>} - Extracted passport data
 */
async function processPassport(filePath, options = {}) {
    const { debug = false } = options;
    const warnings = [];
    const sources = {};
    const confidences = {};

    // Validate file exists
    if (!fs.existsSync(filePath)) {
        return {
            error: 'File not found',
            warnings: ['File does not exist at specified path']
        };
    }

    const ext = path.extname(filePath).toLowerCase();
    let ocrText = '';

    try {
        // ====================================================================
        // STEP 1: Extract text via OCR
        // ====================================================================

        if (ext === '.pdf') {
            ocrText = await extractTextFromPDF(filePath);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            ocrText = await performOCR(filePath);
        } else {
            return {
                error: 'Unsupported file type',
                warnings: ['Please provide a PDF, JPG, or PNG file']
            };
        }

        // ====================================================================
        // STEP 2: Try MRZ parsing (primary truth source)
        // ====================================================================

        let result = parseMRZ(ocrText);

        if (result && result.full_name) {
            // MRZ parsing successful
            sources.full_name = 'MRZ';
            sources.surname = 'MRZ';
            sources.given_names = 'MRZ';
            sources.nationality = 'MRZ';
            sources.country_code = 'MRZ';

            confidences.full_name = result.confidence === 'high' ? 0.95 : 0.7;
            confidences.surname = result.confidence === 'high' ? 0.95 : 0.7;
            confidences.given_names = result.confidence === 'high' ? 0.95 : 0.7;
            confidences.nationality = result.nationality ? 1.0 : 0.5;
            confidences.country_code = 1.0;

            // Add any MRZ warnings
            if (result.warnings && result.warnings.length > 0) {
                warnings.push(...result.warnings);
            }

        } else {
            // ================================================================
            // STEP 3: Fallback to visual OCR parsing
            // ================================================================

            warnings.push('MRZ not detected, falling back to visual OCR');

            result = parseVisualOcr(ocrText);

            if (result) {
                sources.full_name = 'visual_ocr';
                sources.surname = 'visual_ocr';
                sources.given_names = 'visual_ocr';
                sources.nationality = 'visual_ocr';
                sources.country_code = 'visual_ocr';

                confidences.full_name = 0.6;
                confidences.surname = 0.5;
                confidences.given_names = 0.5;
                confidences.nationality = 0.6;
                confidences.country_code = 0.6;
            } else {
                return {
                    error: 'Could not extract passport data',
                    warnings: ['Neither MRZ nor visual OCR extraction succeeded']
                };
            }
        }

        // ====================================================================
        // STEP 4: Construct final response
        // ====================================================================

        const response = {
            full_name: result.full_name || null,
            given_names: result.given_names || null,
            surname: result.surname || null,
            nationality: result.nationality || null,
            country_code: result.country_code || null,
            data_source: sources.full_name || 'unknown',
            sources: sources,
            confidence: confidences,
            warnings: warnings,
        };

        // Include debug info if requested
        if (debug) {
            response.debug = {
                mrz_raw: result.mrz_raw || null,
                checksum_results: result.checksum_results || null,
                ocr_text_preview: ocrText.substring(0, 500),
            };
        }

        return response;

    } catch (error) {
        console.error('Error processing passport:', error);
        return {
            error: error.message,
            warnings: ['Processing error occurred']
        };
    }
}

/**
 * Parse visual OCR text for name and nationality (fallback).
 * Looks for common passport labels.
 * 
 * @param {string} text - OCR text
 * @returns {object|null} - Parsed data or null
 */
function parseVisualOcr(text) {
    const lines = text.split('\n').map(l => l.trim());
    let fullName = null;
    let nationality = null;
    let nationalityCode = null;

    // Look for name patterns
    const namePatterns = [
        /(?:name|full\s*name|given\s*name|surname)\s*[:\-]?\s*(.+)/i,
        /^([A-Z][A-Z\s]+)$/,  // All-caps names
    ];

    for (const line of lines) {
        for (const pattern of namePatterns) {
            const match = line.match(pattern);
            if (match && match[1] && match[1].length > 3) {
                fullName = normalizeName(match[1]);
                break;
            }
        }
        if (fullName) break;
    }

    // Look for nationality patterns
    const nationalityPatterns = [
        /(?:nationality|nation|citizen)\s*[:\-]?\s*([A-Za-z\s]+)/i,
        /\b(IND|PAK|ARE|GBR|USA|CAN|AUS|DEU|FRA)\b/,  // Common codes
    ];

    for (const line of lines) {
        for (const pattern of nationalityPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                const cleaned = match[1].trim().toUpperCase();
                if (cleaned.length === 3) {
                    nationalityCode = cleaned;
                    const countryInfo = getCountryName(cleaned);
                    nationality = countryInfo.name;
                } else {
                    nationality = cleaned;
                }
                break;
            }
        }
        if (nationality) break;
    }

    if (!fullName && !nationality) {
        return null;
    }

    // Split fullName into parts if available
    let surname = '';
    let givenNames = '';
    if (fullName) {
        const parts = fullName.split(' ');
        if (parts.length > 1) {
            givenNames = parts.slice(0, -1).join(' ');
            surname = parts[parts.length - 1];
        } else {
            surname = fullName;
        }
    }

    return {
        full_name: fullName,
        surname: surname,
        given_names: givenNames,
        nationality: nationality,
        country_code: nationalityCode,
        confidence: 'low',
        data_source: 'visual_ocr',
        warnings: [],
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    processPassport,
    parseVisualOcr,
};
