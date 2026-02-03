const { normalizeName, getCountryName } = require('./utils');

/**
 * Parses MRZ data from extracted text.
 * @param {string} text 
 * @returns {object|null}
 */
function parseMRZ(text) {
    const lines = text.split('\n').map(l => l.trim().replace(/\s/g, ''));
    let line1 = null;
    let line2 = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('P<') && line.length >= 40) { // More lenient for OCR
            line1 = line;
            if (i + 1 < lines.length && lines[i + 1].length >= 40) {
                line2 = lines[i + 1];
                break;
            }
        }
    }

    if (!line1 || !line2) return null;

    // Line 1: P<USASTEVENS<<JOHN<ADAM<<<<<<<<<<<<<<<<<<<
    // Name starts after Issuing State (pos 5)
    const namePart = line1.substring(5);
    const [surnamePart, givenNamesPart] = namePart.split('<<');

    // Split by < and filter empty strings for both parts.
    // OCR often misreads < filler as letters like L, K, X, I, or 1.
    const cleanPart = (part) => {
        if (!part) return '';

        return part.split(/[<\s]+/)
            .filter(word => {
                if (!word || word.length === 0) return false;

                // 1. Single characters that are common misreads of <
                if (word.length === 1 && /[LKX1]/.test(word)) return false;

                // 2. Repetitive noise or internal noise sequences (e.g., NAVABJANKKKSYED)
                // We split the word by sequences of 3+ noise chars and only keep the real parts
                if (word.length > 2) {
                    const subParts = word.split(/[LKX]{3,}/).filter(p => p.length > 1);
                    if (subParts.length === 0) return false;
                    // If word was only noise sequences, we'd have filtered it.
                }

                return true;
            })
            .map(word => {
                // Return word cleaned of internal 3+ noise sequences
                return word.split(/[LKX]{3,}/).filter(p => p.length > 1).join(' ');
            })
            .join(' ');
    };

    const givenPartClean = cleanPart(givenNamesPart);
    const surnamePartClean = cleanPart(surnamePart);

    // Combine all words from both parts in the standard order (Given Names + Surname)
    // Most MRZ-P are SURNAME<<GIVEN NAMES
    const allWords = `${givenPartClean} ${surnamePartClean}`.trim().split(/\s+/).filter(w => {
        const norm = normalizeName(w);
        return norm && norm.length > 0;
    });

    let finalName = "";
    if (allWords.length >= 2) {
        // Take first word and last word only
        const first = normalizeName(allWords[0]);
        const last = normalizeName(allWords[allWords.length - 1]);
        finalName = `${first} ${last}`;
    } else if (allWords.length === 1) {
        finalName = normalizeName(allWords[0]);
    }

    const fullNameResult = finalName.trim();

    // Line 2: Nationality is at pos 10-13 (0-indexed: 10, 11, 12)
    let nationalityCode = line2.substring(10, 13).toUpperCase();

    // Cleanup nationality code (handle cases like RE9 -> ARE if A was misread as space or noise)
    // If it contains numbers or is noisy, we try to clean it
    nationalityCode = nationalityCode.replace(/[^A-Z]/g, '');

    // If it's only 2 chars after cleaning, it might be a partial read
    // But getCountryName handles fallback
    const nationality = getCountryName(nationalityCode);

    return {
        source: 'mrz',
        name: fullNameResult || null,
        nationality: nationality || null,
        confidence: 'high'
    };
}

/**
 * Parses visual text fields from extracted text as a fallback.
 * @param {string} text 
 * @returns {object}
 */
function parseVisual(text) {
    const lines = text.split('\n').map(l => l.trim());
    let firstName = null;
    let lastName = null;
    let nationality = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Surname / Last Name
        if (/Surname|Last Name/i.test(line)) {
            const parts = line.split(/[:\-]/);
            if (parts.length > 1 && parts[1].trim()) {
                lastName = parts[1].trim();
            } else if (i + 1 < lines.length) {
                if (!/Given Name|Nationality|Date|Sex|Place/i.test(lines[i + 1])) {
                    lastName = lines[i + 1].trim();
                }
            }
        }

        // Given Names / First Name
        if (/Given Name|First Name|Given Names/i.test(line)) {
            const parts = line.split(/[:\-]/);
            if (parts.length > 1 && parts[1].trim()) {
                firstName = parts[1].trim();
            } else if (i + 1 < lines.length) {
                if (!/Surname|Nationality|Date|Sex|Place/i.test(lines[i + 1])) {
                    firstName = lines[i + 1].trim();
                }
            }
        }

        // Generic Name field if others not found
        if (!firstName && !lastName && /Name/i.test(line) && !/Given|Last|Surname|Nationality|Date|No/i.test(line)) {
            const parts = line.split(/[:\-]/);
            let fullName = null;
            if (parts.length > 1 && parts[1].trim()) {
                fullName = parts[1].trim();
            } else if (i + 1 < lines.length) {
                if (!/Nationality|Date|Sex|Place|No/i.test(lines[i + 1])) {
                    fullName = lines[i + 1].trim();
                }
            }
            if (fullName) {
                // Try to split into words and normalize
                const words = fullName.split(/\s+/).filter(w => w.length > 1 || !/[LKX]/.test(w));
                firstName = words.slice(0, -1).join(' ');
                lastName = words.slice(-1).join('');
            }
        }

        // Nationality parsing
        if (/Nationality/i.test(line)) {
            const parts = line.split(/[:\-]/);
            if (parts.length > 1 && parts[1].trim()) {
                nationality = parts[1].trim();
            } else if (i + 1 < lines.length) {
                nationality = lines[i + 1].trim();
            }
        }
    }

    // Combine all words and take first and last only
    const allWords = `${firstName || ''} ${lastName || ''}`.trim().split(/\s+/).filter(w => {
        const norm = normalizeName(w);
        return norm && norm.length > 0;
    });

    let finalName = "";
    if (allWords.length >= 2) {
        const first = normalizeName(allWords[0]);
        const last = normalizeName(allWords[allWords.length - 1]);
        finalName = `${first} ${last}`;
    } else if (allWords.length === 1) {
        finalName = normalizeName(allWords[0]);
    }

    return {
        source: 'visual',
        name: finalName.trim(),
        nationality: nationality || null,
        confidence: 'medium'
    };
}

module.exports = {
    parseMRZ,
    parseVisual
};
