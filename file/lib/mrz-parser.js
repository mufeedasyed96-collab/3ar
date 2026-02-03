/**
 * ============================================================================
 * MRZ Parser - ICAO TD3 Passport Format
 * ============================================================================
 * 
 * Parses Machine Readable Zone (MRZ) from passport documents.
 * Implements checksum validation for high-confidence extraction.
 * 
 * TD3 Format (Passport):
 * - Line 1 (44 chars): P<ISSUING<SURNAME<<GIVENNAMES<<<<<<<<<<<<<
 * - Line 2 (44 chars): DOCNUM<CHK<NAT<DOB<CHK<SEX<EXP<CHK<<<<<<CHK
 * 
 * ❗ Primary truth source for:
 * - Name structure (surname vs given names)
 * - Country code / nationality
 * - All other passport fields
 * 
 * ============================================================================
 */

const { getCountryName } = require('./country-codes');
const { parseAndNormalizeName } = require('./name-normalizer');

// ============================================================================
// CHECKSUM VALIDATION
// ============================================================================

/**
 * MRZ character weight values.
 * A-Z = 10-35, 0-9 = 0-9, < = 0
 */
function getCharValue(char) {
    if (char >= '0' && char <= '9') return parseInt(char, 10);
    if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 55; // A=10, B=11, etc.
    if (char === '<') return 0;
    return 0;
}

/**
 * Calculate MRZ checksum using modulo 10 weighted sum.
 * Weights cycle: 7, 3, 1, 7, 3, 1, ...
 * 
 * @param {string} str - String to calculate checksum for
 * @returns {number} - Single digit checksum (0-9)
 */
function calculateChecksum(str) {
    const weights = [7, 3, 1];
    let sum = 0;

    for (let i = 0; i < str.length; i++) {
        sum += getCharValue(str[i]) * weights[i % 3];
    }

    return sum % 10;
}

/**
 * Validate a field's checksum.
 * 
 * @param {string} field - Field value
 * @param {string} checkDigit - Expected check digit
 * @returns {boolean} - True if valid
 */
function validateChecksum(field, checkDigit) {
    const calculated = calculateChecksum(field);
    const expected = parseInt(checkDigit, 10);
    return calculated === expected;
}

// ============================================================================
// MRZ LINE DETECTION
// ============================================================================

/**
 * Normalize MRZ text for parsing.
 * - Keep only valid MRZ characters: A-Z, 0-9, <
 * - Remove spaces and other noise
 * 
 * @param {string} text - Raw OCR text
 * @returns {string} - Normalized MRZ text
 */
function normalizeMrzText(text) {
    return text
        .toUpperCase()
        .replace(/[^A-Z0-9<]/g, '');
}

/**
 * Find MRZ lines in OCR text.
 * TD3 passport MRZ has 2 lines of 44 characters each.
 * 
 * @param {string} text - Full OCR text
 * @returns {{line1: string, line2: string}|null} - MRZ lines or null
 */
function findMrzLines(text) {
    const lines = text.split('\n').map(l => l.trim());

    for (let i = 0; i < lines.length; i++) {
        const normalized = normalizeMrzText(lines[i]);

        // Line 1 starts with P< and should be ~44 chars
        if (normalized.startsWith('P<') && normalized.length >= 40) {
            // Look for Line 2 immediately following
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextNormalized = normalizeMrzText(lines[j]);

                // Line 2 should be 44 chars and contain nationality (letters at pos 10-12)
                if (nextNormalized.length >= 40 && /[A-Z]{2,3}/.test(nextNormalized.substring(10, 13))) {
                    return {
                        line1: normalized.substring(0, 44).padEnd(44, '<'),
                        line2: nextNormalized.substring(0, 44).padEnd(44, '<'),
                    };
                }
            }
        }
    }

    return null;
}

// ============================================================================
// TD3 PASSPORT PARSING
// ============================================================================

/**
 * Parse TD3 passport MRZ (2 lines × 44 characters).
 * 
 * Line 1 Structure:
 * - Pos 0:     Document Type (P)
 * - Pos 1:     Type Modifier (<)
 * - Pos 2-4:   Issuing Country (3 letters)
 * - Pos 5-43:  Name (SURNAME<<GIVEN<NAMES<<<...)
 * 
 * Line 2 Structure:
 * - Pos 0-8:   Document Number (9 chars)
 * - Pos 9:     Document Number Check Digit
 * - Pos 10-12: Nationality (3 letters)
 * - Pos 13-18: Date of Birth (YYMMDD)
 * - Pos 19:    DOB Check Digit
 * - Pos 20:    Sex (M/F/<)
 * - Pos 21-26: Expiry Date (YYMMDD)
 * - Pos 27:    Expiry Check Digit
 * - Pos 28-41: Personal Number (14 chars)
 * - Pos 42:    Personal Number Check Digit
 * - Pos 43:    Composite Check Digit
 * 
 * @param {string} text - OCR text containing MRZ
 * @returns {object|null} - Parsed data or null
 */
function parseMRZ(text) {
    const mrzLines = findMrzLines(text);

    if (!mrzLines) {
        return null;
    }

    const { line1, line2 } = mrzLines;
    const warnings = [];
    const checksumResults = {};

    // ========================================================================
    // PARSE LINE 1
    // ========================================================================

    // Document type (position 0)
    const documentType = line1.charAt(0);

    // Issuing country (positions 2-4)
    const issuingCountryCode = line1.substring(2, 5).replace(/</g, '');

    // Name field (positions 5-43)
    const nameField = line1.substring(5);

    // Parse and normalize name
    const { surname, givenNames, fullName } = parseAndNormalizeName(nameField);

    // ========================================================================
    // PARSE LINE 2
    // ========================================================================

    // Document number (positions 0-8, check at 9)
    const documentNumber = line2.substring(0, 9).replace(/</g, '');
    const docCheckDigit = line2.charAt(9);
    checksumResults.documentNumber = validateChecksum(line2.substring(0, 9), docCheckDigit);

    // Nationality (positions 10-12)
    // Clean the code: remove non-letter chars, take first 3 letters
    let nationalityCodeRaw = line2.substring(10, 13);
    let nationalityCode = nationalityCodeRaw.replace(/[^A-Z]/g, '').substring(0, 3);

    // Get the country name
    let nationalityInfo = getCountryName(nationalityCode);

    // FALLBACK STRATEGY:
    // 1. If nationality code is invalid (no name found), use issuing country
    // 2. If issuing country also fails, try partial matches
    if (!nationalityInfo.name) {
        // Try issuing country (usually same as nationality)
        nationalityInfo = getCountryName(issuingCountryCode);

        // If that also fails, set code to issuing country at least
        if (!nationalityInfo.name && issuingCountryCode && issuingCountryCode.length >= 2) {
            nationalityInfo = { code: issuingCountryCode, name: null };
        }
    }

    // Last resort: if still no name but we have ARE in issuing, it's UAE
    if (!nationalityInfo.name && issuingCountryCode) {
        if (issuingCountryCode.includes('ARE') || issuingCountryCode.includes('AE')) {
            nationalityInfo = { code: 'ARE', name: 'United Arab Emirates' };
        } else if (issuingCountryCode.includes('IND') || issuingCountryCode.includes('IN')) {
            nationalityInfo = { code: 'IND', name: 'India' };
        }
    }

    // Date of birth (positions 13-18, check at 19)
    const dobRaw = line2.substring(13, 19);
    const dobCheckDigit = line2.charAt(19);
    checksumResults.dateOfBirth = validateChecksum(dobRaw, dobCheckDigit);

    // Sex (position 20)
    const sex = line2.charAt(20);

    // Expiry date (positions 21-26, check at 27)
    const expiryRaw = line2.substring(21, 27);
    const expiryCheckDigit = line2.charAt(27);
    checksumResults.expiryDate = validateChecksum(expiryRaw, expiryCheckDigit);

    // Personal number (positions 28-41, check at 42)
    const personalNumber = line2.substring(28, 42).replace(/</g, '');
    const personalCheckDigit = line2.charAt(42);
    checksumResults.personalNumber = validateChecksum(line2.substring(28, 42), personalCheckDigit);

    // Composite check (position 43)
    // Covers: doc number + check + DOB + check + expiry + check + personal + check
    const compositeString = line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
    const compositeCheckDigit = line2.charAt(43);
    checksumResults.composite = validateChecksum(compositeString, compositeCheckDigit);

    // ========================================================================
    // DETERMINE CONFIDENCE
    // ========================================================================

    const allChecksumsPass = Object.values(checksumResults).every(v => v === true);
    const confidence = allChecksumsPass ? 'high' : 'low';

    if (!allChecksumsPass) {
        const failedChecks = Object.entries(checksumResults)
            .filter(([_, pass]) => !pass)
            .map(([field]) => field);
        warnings.push(`Checksum validation failed for: ${failedChecks.join(', ')}`);
    }

    // ========================================================================
    // RETURN RESULT
    // ========================================================================

    return {
        // Core fields (user requested)
        full_name: fullName,
        surname: surname,
        given_names: givenNames,
        nationality: nationalityInfo.name,
        country_code: nationalityInfo.code,

        // Additional parsed fields (for reference)
        document_type: documentType,
        issuing_country_code: issuingCountryCode,
        document_number: documentNumber,
        date_of_birth: formatMrzDate(dobRaw),
        sex: sex === '<' ? null : sex,
        expiry_date: formatMrzDate(expiryRaw),

        // Metadata
        data_source: 'MRZ',
        confidence: confidence,
        mrz_raw: { line1, line2 },
        checksum_results: checksumResults,
        warnings: warnings,
    };
}

/**
 * Format MRZ date (YYMMDD) to YYYY-MM-DD.
 * Assumes dates in range 1930-2029.
 * 
 * @param {string} mrzDate - YYMMDD format
 * @returns {string|null} - YYYY-MM-DD or null if invalid
 */
function formatMrzDate(mrzDate) {
    if (!mrzDate || mrzDate.length !== 6) return null;

    const yy = parseInt(mrzDate.substring(0, 2), 10);
    const mm = mrzDate.substring(2, 4);
    const dd = mrzDate.substring(4, 6);

    // Assume: 00-29 = 2000-2029, 30-99 = 1930-1999
    const century = yy <= 29 ? 2000 : 1900;
    const year = century + yy;

    return `${year}-${mm}-${dd}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    parseMRZ,
    findMrzLines,
    normalizeMrzText,
    calculateChecksum,
    validateChecksum,
    formatMrzDate,
};
