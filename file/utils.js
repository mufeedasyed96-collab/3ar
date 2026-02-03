const iso3166 = require('iso-3166-1');

/**
 * Normalizes a name string: uppercase words separated by spaces.
 * @param {string} name 
 * @returns {string}
 */
function normalizeName(name) {
    if (!name) return '';
    return name
        .trim()
        .toUpperCase()
        .replace(/</g, ' ')
        .replace(/[^A-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(word => {
            // Filter out single letter noise
            if (word.length === 1 && /[LKX1]/.test(word)) return false;
            return word.length > 0;
        })
        .join(' '); // Restored space between name parts
}

/**
 * Converts a 3-letter country code to a full country name.
 * Handles standard ISO codes and common MRZ variations.
 * @param {string} code 
 * @returns {string}
 */
function getCountryName(code) {
    if (!code) return null;
    const cleanCode = code.toUpperCase().trim();

    // Custom mapping for common variations or codes not in standard library
    const customMapping = {
        'UAE': 'United Arab Emirates',
        'ARE': 'United Arab Emirates',
        'RE': 'United Arab Emirates', // Handle partial ARE misreads
        'AR': 'United Arab Emirates', // Handle partial ARE misreads
        'GBR': 'United Kingdom',
        'USA': 'United States of America',
        // Add more common MRZ variations if needed
    };

    if (customMapping[cleanCode]) {
        return customMapping[cleanCode];
    }

    const country = iso3166.whereAlpha3(cleanCode);
    return country ? country.country : cleanCode; // Fallback to code if name not found
}

module.exports = {
    normalizeName,
    getCountryName
};
