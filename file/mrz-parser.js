/**
 * ============================================================================
 * MRZ Parser - Production-Ready Passport Data Extraction
 * ============================================================================
 * 
 * This module parses ICAO TD3 Machine Readable Zone (MRZ) data from passports.
 * It handles common OCR noise patterns and normalizes names for human-readable output.
 * 
 * ❗ IMPORTANT UI RULE:
 * ❗ Never display raw MRZ names in UI.
 * ❗ Always display normalized fullName.
 * 
 * Supports all nationalities via ISO-3166 alpha-3 mapping.
 * ============================================================================
 */

const iso3166 = require('iso-3166-1');

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Custom nationality mappings for codes not in standard ISO library or common MRZ variations.
 * These handle OCR misreads and region-specific codes.
 */
const CUSTOM_NATIONALITY_MAP = {
    // UAE variations (ARE is standard, but OCR often misreads)
    'ARE': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'AR': 'United Arab Emirates',
    'RE': 'United Arab Emirates',

    // Common codes
    'GBR': 'United Kingdom',
    'USA': 'United States of America',
    'IND': 'India',
    'PAK': 'Pakistan',
    'CHN': 'China',
    'JPN': 'Japan',
    'KOR': 'South Korea',
    'DEU': 'Germany',
    'FRA': 'France',
    'RUS': 'Russia',
    'BRA': 'Brazil',
    'CAN': 'Canada',
    'AUS': 'Australia',
    'SAU': 'Saudi Arabia',
    'EGY': 'Egypt',
    'PHL': 'Philippines',
    'BGD': 'Bangladesh',
    'IDN': 'Indonesia',
    'NGA': 'Nigeria',
    'MEX': 'Mexico',
};

/**
 * OCR noise patterns that are commonly misread from MRZ filler characters (<).
 * These patterns should be treated as separators in name fields.
 */
const OCR_NOISE_PATTERNS = [
    /C{2,}/g,           // Multiple C's (most common misread of <)
    /L{2,}/g,           // Multiple L's
    /K{2,}/g,           // Multiple K's
    /X{2,}/g,           // Multiple X's
    /S{3,}/g,           // Multiple S's (common in some OCR engines)
    /I{3,}/g,           // Multiple I's
    /H{3,}/g,           // Multiple H's
    /N{3,}/g,           // Multiple N's (at word boundaries only)
    /[CL]{3,}/g,        // Mixed C and L sequences
    /[CLK]{3,}/g,       // Mixed noise characters
    /[CLKXS]{3,}/g,     // Extended mixed noise
    /[CLKXSIH]{4,}/g,   // Very long mixed noise sequences
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a string to Title Case.
 * Example: "JOHN ADAM" -> "John Adam"
 * 
 * @param {string} str - Input string
 * @returns {string} - Title-cased string
 */
function toTitleCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Gets the full country name from an ISO-3166 alpha-3 code.
 * Falls back to custom mappings, then to "Unknown" if not found.
 * 
 * @param {string} code - 3-letter country code
 * @returns {{code: string, name: string}} - Nationality object
 */
function getNationality(code) {
    if (!code) return { code: null, name: 'Unknown' };

    const cleanCode = code.toUpperCase().replace(/[^A-Z]/g, '');

    // 1. Check custom mappings first (handles OCR variations)
    if (CUSTOM_NATIONALITY_MAP[cleanCode]) {
        return { code: cleanCode, name: CUSTOM_NATIONALITY_MAP[cleanCode] };
    }

    // 2. Try ISO-3166 library
    const country = iso3166.whereAlpha3(cleanCode);
    if (country) {
        return { code: cleanCode, name: country.country };
    }

    // 3. Fallback: return code with "Unknown" name
    return { code: cleanCode, name: 'Unknown' };
}

/**
 * Normalizes an MRZ name field by removing OCR noise and converting to Title Case.
 * 
 * MRZ Name Structure:
 * - Surname and given names are separated by <<
 * - Individual names within each part are separated by <
 * - OCR often misreads < as C, L, K, or X
 * 
 * @param {string} rawName - Raw MRZ name field
 * @returns {string} - Clean, human-readable name in Title Case
 */
function normalizeMrzName(rawName) {
    if (!rawName) return '';

    let cleaned = rawName.toUpperCase();

    // Step 1: Replace << with a temporary marker (surname/given separator)
    cleaned = cleaned.replace(/<</g, '|||');

    // Step 2: Replace single < with space
    cleaned = cleaned.replace(/</g, ' ');

    // Step 3: Remove OCR noise patterns (C, L, K sequences become spaces)
    OCR_NOISE_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    // Step 4: Remove any remaining non-alphabet characters (except space and marker)
    cleaned = cleaned.replace(/[^A-Z\s|]/g, ' ');

    // Step 5: Restore the surname/given separator
    cleaned = cleaned.replace(/\|\|\|/g, ' ');

    // Step 6: Collapse multiple spaces into one
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Step 7: Convert to Title Case
    return toTitleCase(cleaned);
}

/**
 * Cleans an MRZ name part (surname or given names) for separate extraction.
 * 
 * @param {string} part - Raw MRZ name part
 * @returns {string} - Cleaned name part in Title Case
 */
function cleanMrzPart(part) {
    if (!part) return '';

    let cleaned = part.toUpperCase();

    // Replace < with space
    cleaned = cleaned.replace(/</g, ' ');

    // Remove OCR noise patterns
    OCR_NOISE_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    // Remove trailing noise characters (single C, L, K, X, S at word boundaries)
    cleaned = cleaned.replace(/\b[CLKXS]\b/g, ' ');

    // Remove non-alphabet characters
    cleaned = cleaned.replace(/[^A-Z\s]/g, ' ');

    // Collapse spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return toTitleCase(cleaned);
}

// ============================================================================
// MAIN MRZ PARSER
// ============================================================================

/**
 * Parses MRZ data from OCR text and extracts passport information.
 * Supports ICAO TD3 format (2-line, 44 characters each).
 * 
 * MRZ Line 1 Structure (44 chars):
 * - Pos 0-1:  Document Type (e.g., "P<")
 * - Pos 2-4:  Issuing Country (3-letter code)
 * - Pos 5-43: Name (Surname<<Given Names<<<<...)
 * 
 * MRZ Line 2 Structure (44 chars):
 * - Pos 0-8:  Passport Number
 * - Pos 9:    Check Digit
 * - Pos 10-12: Nationality (3-letter code)
 * - Pos 13-18: Date of Birth (YYMMDD)
 * - Pos 19:   Check Digit
 * - Pos 20:   Sex
 * - Pos 21-26: Expiry Date (YYMMDD)
 * - Pos 27:   Check Digit
 * - Pos 28-41: Personal Number
 * - Pos 42:   Check Digit
 * - Pos 43:   Overall Check Digit
 * 
 * @param {string} text - Raw OCR text containing MRZ
 * @returns {object|null} - Parsed passport data or null if MRZ not found
 */
function parseMRZ(text) {
    const warnings = [];

    // Split text into lines and normalize (remove spaces within lines)
    const lines = text.split('\n').map(l => l.trim().replace(/\s/g, ''));

    let line1 = null;
    let line2 = null;

    // Search for MRZ lines (Line 1 starts with P<, both lines should be ~44 chars)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // MRZ Line 1 detection: starts with P< and is at least 40 chars (lenient for OCR)
        if (line.startsWith('P<') && line.length >= 40) {
            line1 = line;

            // MRZ Line 2 should immediately follow
            if (i + 1 < lines.length && lines[i + 1].length >= 40) {
                line2 = lines[i + 1];
                break;
            }
        }
    }

    // If MRZ not found, return null
    if (!line1 || !line2) {
        return null;
    }

    // ========================================================================
    // PARSE LINE 1: Document Type, Issuing Country, Name
    // ========================================================================

    // Document Type (positions 0-1)
    const documentType = line1.substring(0, 1); // Usually "P" for passport

    // Issuing Country (positions 2-4, after "P<")
    const issuingCountry = line1.substring(2, 5).replace(/</g, '');

    // Name field (positions 5-43)
    // Format: SURNAME<<GIVEN<NAMES<<<<...
    const nameField = line1.substring(5);
    const mrzRawNameField = nameField; // Keep for debugging

    // Split surname and given names by <<
    const nameParts = nameField.split('<<');
    const surnameRaw = nameParts[0] || '';
    const givenNamesRaw = nameParts.slice(1).join(' ') || '';

    // Clean and normalize name parts
    const surname = cleanMrzPart(surnameRaw);
    const givenNames = cleanMrzPart(givenNamesRaw);

    // Construct full name (Given Names + Surname is more natural in most cultures)
    // But some cultures prefer Surname first - we'll use Given + Surname as default
    let fullName = '';
    if (givenNames && surname) {
        fullName = `${givenNames} ${surname}`;
    } else if (surname) {
        fullName = surname;
    } else if (givenNames) {
        fullName = givenNames;
    }

    // Add warning if name seems corrupted
    if (fullName.length < 3) {
        warnings.push('Name extraction may be incomplete');
    }

    // ========================================================================
    // PARSE LINE 2: Nationality
    // ========================================================================

    // Nationality Code (positions 10-12)
    let nationalityCode = line2.substring(10, 13).toUpperCase();

    // Clean nationality code (remove non-letters, handle OCR noise)
    nationalityCode = nationalityCode.replace(/[^A-Z]/g, '');

    // Get full nationality name
    const nationalityResult = getNationality(nationalityCode);

    if (nationalityResult.name === 'Unknown') {
        warnings.push(`Unknown nationality code: ${nationalityCode}`);
    }

    // ========================================================================
    // CONSTRUCT RESULT
    // ========================================================================

    return {
        document_type: documentType,
        issuing_country: issuingCountry,
        full_name: fullName,
        surname: surname,
        given_names: givenNames,
        nationality_code: nationalityResult.code,
        nationality: nationalityResult.name,
        data_source: 'MRZ',
        mrz_raw_name_field: mrzRawNameField, // For debugging only
        warnings: warnings
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    parseMRZ,
    normalizeMrzName,
    cleanMrzPart,
    getNationality,
    toTitleCase
};
