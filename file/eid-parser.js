/**
 * ============================================================================
 * Emirates ID Parser
 * ============================================================================
 * 
 * Extracts data from UAE Emirates ID cards:
 * - Full Name
 * - Nationality
 * - EID Number (format: 784-XXXX-XXXXXXX-X)
 * 
 * ============================================================================
 */

const { COUNTRY_CODES, getCountryName } = require('./lib/country-codes');

// UAE nationality variations
const UAE_NATIONALITY_PATTERNS = [
    /united\s*arab\s*emirates/i,
    /\bUAE\b/i,
    /\bARE\b/,
    /الإمارات/,
];

// Common nationality patterns in EID
const NATIONALITY_PATTERNS = [
    /nationality[:\s]*([A-Za-z\s]+)/i,
    /nationality[:\s]*(\w{3})/i,
    /\b(INDIA|INDIAN|IND)\b/i,
    /\b(PAKISTAN|PAKISTANI|PAK)\b/i,
    /\b(PHILIPPINES|FILIPINO|PHL)\b/i,
    /\b(BANGLADESH|BANGLADESHI|BGD)\b/i,
    /\b(EGYPT|EGYPTIAN|EGY)\b/i,
    /\b(SRI LANKA|SRI LANKAN|LKA)\b/i,
    /\b(NEPAL|NEPALESE|NPL)\b/i,
    /\b(JORDAN|JORDANIAN|JOR)\b/i,
    /\b(SYRIA|SYRIAN|SYR)\b/i,
    /\b(LEBANON|LEBANESE|LBN)\b/i,
];

// EID number pattern: 784-XXXX-XXXXXXX-X
const EID_PATTERNS = [
    /784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/g,           // Standard format
    /784\d{13}/g,                                    // Without dashes
    /ID\s*No[:\s.]*(\d{3}[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)/i,  // With label
    /(\d{3}[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)/g,      // Generic 15-digit
];

// Name patterns
const NAME_PATTERNS = [
    /name[:\s]*([A-Za-z\s]+)/i,
    /([A-Z][A-Z\s]{5,30})/g,  // All caps names
];

/**
 * Clean and normalize a name from OCR text.
 * 
 * @param {string} name - Raw name from OCR
 * @returns {string} - Cleaned name in Title Case
 */
function cleanName(name) {
    if (!name) return '';

    // Remove noise characters
    let cleaned = name
        .replace(/[^A-Za-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Convert to Title Case
    return cleaned
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format EID number to standard format: 784-XXXX-XXXXXXX-X
 * 
 * @param {string} eid - Raw EID number
 * @returns {string} - Formatted EID
 */
function formatEID(eid) {
    if (!eid) return '';

    // Remove all non-digits
    const digits = eid.replace(/\D/g, '');

    if (digits.length !== 15) {
        return digits; // Return as-is if not 15 digits
    }

    // Format: 784-XXXX-XXXXXXX-X
    return `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7, 14)}-${digits.substring(14)}`;
}

/**
 * Extract nationality from OCR text.
 * NOTE: Emirates ID shows UAE as issuing country, but the cardholder's
 * nationality is a separate field. We prioritize finding the actual nationality.
 * 
 * @param {string} text - OCR text
 * @returns {{code: string, name: string}} - Nationality info
 */
function extractNationality(text) {
    const upperText = text.toUpperCase();

    // PRIORITY 1: Look for "Nationality: <country>" pattern
    // This is the actual cardholder nationality, not the issuing country
    const nationalityFieldMatch = text.match(/nationality[:\s]*([A-Za-z]+)/i);
    if (nationalityFieldMatch) {
        const found = nationalityFieldMatch[1].toUpperCase().trim();

        // Map common nationality names to ISO codes
        const nationalityMap = {
            'INDIA': 'IND', 'INDIAN': 'IND', 'IND': 'IND',
            'PAKISTAN': 'PAK', 'PAKISTANI': 'PAK', 'PAK': 'PAK',
            'PHILIPPINES': 'PHL', 'FILIPINO': 'PHL', 'PHL': 'PHL',
            'BANGLADESH': 'BGD', 'BANGLADESHI': 'BGD', 'BGD': 'BGD',
            'EGYPT': 'EGY', 'EGYPTIAN': 'EGY', 'EGY': 'EGY',
            'SRILANKA': 'LKA', 'SRILANKAN': 'LKA', 'LKA': 'LKA',
            'NEPAL': 'NPL', 'NEPALESE': 'NPL', 'NPL': 'NPL',
            'JORDAN': 'JOR', 'JORDANIAN': 'JOR', 'JOR': 'JOR',
            'SYRIA': 'SYR', 'SYRIAN': 'SYR', 'SYR': 'SYR',
            'LEBANON': 'LBN', 'LEBANESE': 'LBN', 'LBN': 'LBN',
            'CHINA': 'CHN', 'CHINESE': 'CHN', 'CHN': 'CHN',
            'IRAN': 'IRN', 'IRANIAN': 'IRN', 'IRN': 'IRN',
            'IRAQ': 'IRQ', 'IRAQI': 'IRQ', 'IRQ': 'IRQ',
            'YEMEN': 'YEM', 'YEMENI': 'YEM', 'YEM': 'YEM',
            'OMAN': 'OMN', 'OMANI': 'OMN', 'OMN': 'OMN',
            'KUWAIT': 'KWT', 'KUWAITI': 'KWT', 'KWT': 'KWT',
            'SAUDI': 'SAU', 'SAUDIARABIA': 'SAU', 'SAU': 'SAU',
            'UAE': 'ARE', 'EMIRATI': 'ARE', 'ARE': 'ARE',
        };

        const code = nationalityMap[found] || found.substring(0, 3);
        const countryInfo = getCountryName(code);

        if (countryInfo.name) {
            return countryInfo;
        }
    }

    // PRIORITY 2: Look for specific country names in text
    const countryPatterns = [
        { pattern: /\bINDIA\b/i, code: 'IND', name: 'India' },
        { pattern: /\bPAKISTAN\b/i, code: 'PAK', name: 'Pakistan' },
        { pattern: /\bPHILIPPINES\b/i, code: 'PHL', name: 'Philippines' },
        { pattern: /\bBANGLADESH\b/i, code: 'BGD', name: 'Bangladesh' },
        { pattern: /\bEGYPT\b/i, code: 'EGY', name: 'Egypt' },
        { pattern: /\bNEPAL\b/i, code: 'NPL', name: 'Nepal' },
        { pattern: /\bSRI\s*LANKA\b/i, code: 'LKA', name: 'Sri Lanka' },
        { pattern: /\bJORDAN\b/i, code: 'JOR', name: 'Jordan' },
        { pattern: /\bSYRIA\b/i, code: 'SYR', name: 'Syria' },
        { pattern: /\bLEBANON\b/i, code: 'LBN', name: 'Lebanon' },
        { pattern: /\bIRAN\b/i, code: 'IRN', name: 'Iran' },
        { pattern: /\bIRAQ\b/i, code: 'IRQ', name: 'Iraq' },
        { pattern: /\bCHINA\b/i, code: 'CHN', name: 'China' },
        { pattern: /\bYEMEN\b/i, code: 'YEM', name: 'Yemen' },
    ];

    for (const { pattern, code, name } of countryPatterns) {
        if (pattern.test(text)) {
            return { code, name };
        }
    }

    // PRIORITY 3: Only if no other nationality found, check for UAE
    // This means the cardholder is actually Emirati
    for (const pattern of UAE_NATIONALITY_PATTERNS) {
        if (pattern.test(text)) {
            // Only return UAE if it's in a nationality context
            if (/nationality[:\s]*(united|uae|emirati|are)/i.test(text)) {
                return { code: 'ARE', name: 'United Arab Emirates' };
            }
        }
    }

    return { code: null, name: null };
}

/**
 * Extract EID number from OCR text.
 * 
 * @param {string} text - OCR text
 * @returns {string|null} - EID number or null
 */
function extractEID(text) {
    // Clean text for number extraction
    const cleanedText = text.replace(/\s+/g, ' ');

    for (const pattern of EID_PATTERNS) {
        const matches = cleanedText.match(pattern);
        if (matches) {
            for (const match of matches) {
                const digits = match.replace(/\D/g, '');
                // EID must start with 784 and be 15 digits
                if (digits.startsWith('784') && digits.length === 15) {
                    return formatEID(digits);
                }
                // Also accept if 15 digits
                if (digits.length === 15) {
                    return formatEID(digits);
                }
            }
        }
    }

    // Last resort: find any 15-digit sequence
    const allDigits = text.replace(/[^\d]/g, '');
    const fifteenDigitMatch = allDigits.match(/784\d{12}/);
    if (fifteenDigitMatch) {
        return formatEID(fifteenDigitMatch[0]);
    }

    return null;
}

/**
 * Extract name from OCR text.
 * 
 * @param {string} text - OCR text
 * @returns {string|null} - Extracted name or null
 */
function extractName(text) {
    // Look for "Name:" pattern first
    const nameMatch = text.match(/name[:\s]*([A-Za-z\s]{3,40})/i);
    if (nameMatch) {
        return cleanName(nameMatch[1]);
    }

    // Look for all-caps sequences that could be names
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Look for lines that are mostly alphabetical and could be a name
        if (/^[A-Z][A-Z\s]{5,35}$/.test(trimmed)) {
            // Filter out common non-name patterns
            if (!/^(UNITED|EMIRATE|IDENTITY|CARD|NUMBER|DATE|BIRTH|EXPIRY|ISSUE)/.test(trimmed)) {
                return cleanName(trimmed);
            }
        }
    }

    return null;
}

/**
 * Parse Emirates ID from OCR text.
 * 
 * @param {string} text - OCR text from Emirates ID
 * @returns {object} - Extracted data
 */
function parseEmiratesID(text) {
    const warnings = [];

    // Extract fields
    const eid = extractEID(text);
    const name = extractName(text);
    const nationality = extractNationality(text);

    if (!eid) {
        warnings.push('EID number not detected');
    }
    if (!name) {
        warnings.push('Name not detected');
    }
    if (!nationality.name) {
        warnings.push('Nationality not detected');
    }

    return {
        document_type: 'Emirates ID',
        full_name: name,
        nationality: nationality.name,
        nationality_code: nationality.code,
        eid_number: eid,
        data_source: 'OCR',
        warnings: warnings,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    parseEmiratesID,
    extractEID,
    extractName,
    extractNationality,
    formatEID,
    cleanName,
};
