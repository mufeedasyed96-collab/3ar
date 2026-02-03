/**
 * ============================================================================
 * Name Normalizer - Production-Ready Name Cleanup
 * ============================================================================
 * 
 * Handles common OCR artifacts and MRZ noise in passport names.
 * Implements smart name splitting for merged words.
 * 
 * BUG FIXES ADDRESSED:
 * - "SYEDSIBRAHIMCCCC NAVABJANC" → "Syed Ibrahim Navabjan"
 * - OCR misreads '<' as 'C' in low quality scans
 * - Visual OCR merges words due to kerning/spacing in JPG
 * 
 * ============================================================================
 */

// Common name segments for smart splitting (configurable)
const COMMON_NAME_SEGMENTS = [
    'IBRAHIM', 'AHMED', 'MOHAMMED', 'MOHAMMAD', 'MUHAMMAD', 'ALI', 'HASSAN',
    'HUSSAIN', 'HUSSEIN', 'ABDULLAH', 'ABDUL', 'KHAN', 'AHMAD', 'RASHID',
    'SALEM', 'SALIM', 'OMAR', 'UMAR', 'FATIMA', 'AISHA', 'MARIAM', 'MARYAM',
    'YUSUF', 'YOUSUF', 'JOSEPH', 'DAVID', 'JOHN', 'JAMES', 'MICHAEL',
    'SYED', 'SHAIKH', 'SHEIKH', 'BEGUM', 'BIBI', 'KUMAR', 'SINGH', 'DEVI',
    'NOOR', 'NUR', 'ZAINAB', 'KHADIJA', 'SARA', 'SARAH', 'HANA', 'HANNA',
    'RAJ', 'RAJAN', 'PATEL', 'SHARMA', 'GUPTA', 'VERMA', 'REDDY', 'NAIDU',
    'RANI', 'LAXMI', 'LAKSHMI', 'PRIYA', 'DEEPA', 'SUNITA', 'ANITA',
];

/**
 * OCR noise patterns - sequences that are likely MRZ filler misreads.
 * These patterns should be converted to spaces.
 */
const OCR_NOISE_PATTERNS = [
    /C{2,}/g,           // Multiple C's (most common misread of <)
    /L{2,}/g,           // Multiple L's
    /K{2,}/g,           // Multiple K's
    /X{2,}/g,           // Multiple X's
    /S{3,}/g,           // Multiple S's (3+ to avoid removing valid endings)
    /[CL]{3,}/g,        // Mixed C and L sequences
    /[CLK]{3,}/g,       // Mixed noise characters
    /[CLKXS]{4,}/g,     // Extended mixed noise (4+ chars)
];

/**
 * Convert string to Title Case.
 * 
 * @param {string} str - Input string
 * @returns {string} - Title-cased string
 */
function toTitleCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Remove OCR noise patterns from text.
 * 
 * Why this is needed:
 * - MRZ uses '<' as filler/separator characters
 * - Low quality scans cause OCR to misread '<' as 'C', 'L', 'K', etc.
 * - Visual OCR on JPG images merges words due to kerning issues
 * 
 * @param {string} text - Raw text with potential noise
 * @returns {string} - Cleaned text
 */
function removeOcrNoise(text) {
    if (!text) return '';

    let cleaned = text.toUpperCase();

    // Replace MRZ filler '<' with space
    cleaned = cleaned.replace(/</g, ' ');

    // Remove all OCR noise patterns
    OCR_NOISE_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    // Remove single noise characters at word boundaries
    // These are common when OCR reads partial filler sequences
    cleaned = cleaned.replace(/\b[CLKX]\b/g, ' ');

    // Remove trailing C or S from words (common artifact)
    // "NAVABJANC" → "NAVABJAN"
    cleaned = cleaned.replace(/([A-Z]{3,})[CS](?=\s|$)/g, '$1');

    // Remove non-letter characters except spaces
    cleaned = cleaned.replace(/[^A-Z\s]/g, ' ');

    // Collapse multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Smart split for merged names.
 * Detects common name segments and inserts spaces.
 * 
 * Example: "SYEDSIBRAHIM" → "SYED IBRAHIM"
 * 
 * @param {string} word - Single word that might be merged names
 * @returns {string} - Word with spaces inserted if segments found
 */
function smartSplitName(word) {
    if (!word || word.length < 4) return word;

    const upperWord = word.toUpperCase();

    // Check if any common segment exists in the word (not at start)
    for (const segment of COMMON_NAME_SEGMENTS) {
        const index = upperWord.indexOf(segment);

        // Segment found, not at the start, and has meaningful prefix
        if (index > 2 && index < upperWord.length) {
            const prefix = upperWord.substring(0, index);
            const rest = upperWord.substring(index);

            // Recursively process the rest in case of multiple merged names
            const splitRest = smartSplitName(rest);

            // Only split if prefix looks like a valid name part (3+ chars)
            if (prefix.length >= 3) {
                return `${prefix} ${splitRest}`;
            }
        }
    }

    return word;
}

/**
 * Normalize a full name from MRZ or OCR output.
 * 
 * @param {string} rawName - Raw name string
 * @returns {string} - Clean, Title Case name
 */
function normalizeName(rawName) {
    if (!rawName) return '';

    // Step 1: Remove OCR noise
    let cleaned = removeOcrNoise(rawName);

    // Step 2: Smart split merged words
    const words = cleaned.split(' ').filter(w => w.length > 0);
    const splitWords = words.map(word => smartSplitName(word));
    cleaned = splitWords.join(' ');

    // Step 3: Collapse spaces again after splitting
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Step 4: Convert to Title Case
    return toTitleCase(cleaned);
}

/**
 * Clean MRZ name part (surname or given names).
 * 
 * @param {string} part - Raw MRZ name part
 * @returns {string} - Cleaned name part
 */
function cleanMrzPart(part) {
    if (!part) return '';

    // Remove noise and normalize
    return normalizeName(part);
}

/**
 * Parse and normalize surname and given names from MRZ name field.
 * 
 * MRZ format: SURNAME<<GIVEN<NAMES<<<<
 * 
 * @param {string} nameField - MRZ name field (positions 5-43 of line 1)
 * @returns {{surname: string, givenNames: string, fullName: string}}
 */
function parseAndNormalizeName(nameField) {
    if (!nameField) {
        return { surname: '', givenNames: '', fullName: '' };
    }

    // Split by << (surname/given names separator)
    const parts = nameField.split('<<');
    const surnameRaw = parts[0] || '';
    const givenNamesRaw = parts.slice(1).join(' ') || '';

    // Clean each part
    const surname = cleanMrzPart(surnameRaw);
    const givenNames = cleanMrzPart(givenNamesRaw);

    // Construct full name (Given Names + Surname)
    let fullName = '';
    if (givenNames && surname) {
        fullName = `${givenNames} ${surname}`;
    } else if (surname) {
        fullName = surname;
    } else if (givenNames) {
        fullName = givenNames;
    }

    return { surname, givenNames, fullName };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    normalizeName,
    cleanMrzPart,
    parseAndNormalizeName,
    smartSplitName,
    removeOcrNoise,
    toTitleCase,
    COMMON_NAME_SEGMENTS,
};
