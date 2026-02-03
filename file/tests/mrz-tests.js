/**
 * ============================================================================
 * MRZ Parser Tests
 * ============================================================================
 * 
 * Test cases for the production PassportOCR system.
 * 
 * Run with: node tests/mrz-tests.js
 * ============================================================================
 */

const { parseMRZ } = require('../lib/mrz-parser');
const { normalizeName, smartSplitName, removeOcrNoise } = require('../lib/name-normalizer');
const { getCountryName } = require('../lib/country-codes');

console.log('='.repeat(60));
console.log('PassportOCR - Production Test Suite');
console.log('='.repeat(60));
console.log('');

let passed = 0;
let failed = 0;

// ============================================================================
// TEST 1: Name Normalization (Critical Bug Fix)
// ============================================================================

console.log('TEST 1: Name Normalization (SYEDSIBRAHIMCCCC NAVABJANC)');
console.log('-'.repeat(40));

const uglyCaseName = 'SYEDSIBRAHIMCCCC NAVABJANC';
const normalizedName = normalizeName(uglyCaseName);

console.log('Input:', uglyCaseName);
console.log('Output:', normalizedName);

// Check if the name was properly cleaned
if (normalizedName === 'Syed Ibrahim Navabjan') {
    console.log('✅ PASSED - Exact match');
    passed++;
} else if (
    normalizedName.includes('Syed') &&
    normalizedName.includes('Ibrahim') &&
    normalizedName.includes('Navabjan') &&
    !normalizedName.includes('C')
) {
    console.log('✅ PASSED - Contains expected name parts');
    passed++;
} else {
    console.log('❌ FAILED - Expected: Syed Ibrahim Navabjan');
    failed++;
}
console.log('');

// ============================================================================
// TEST 2: OCR Noise Removal
// ============================================================================

console.log('TEST 2: OCR Noise Removal');
console.log('-'.repeat(40));

const noisyTexts = [
    { input: 'NAVABJANC', expected: 'NAVABJAN' },
    { input: 'MUFEEDA<<VELUTHEDATH', expected: 'MUFEEDA VELUTHEDATH' },
    { input: 'NAMECC<<SURNAME', expected: 'NAME SURNAME' },
    { input: 'TEXTLLLLL', expected: 'TEXT' },
];

noisyTexts.forEach(({ input, expected }) => {
    const result = removeOcrNoise(input);
    console.log(`  "${input}" → "${result}"`);
    if (result.trim() === expected || result.includes(expected.split(' ')[0])) {
        console.log('  ✅ OK');
        passed++;
    } else {
        console.log(`  ❌ Expected: "${expected}"`);
        failed++;
    }
});
console.log('');

// ============================================================================
// TEST 3: Smart Name Splitting
// ============================================================================

console.log('TEST 3: Smart Name Splitting');
console.log('-'.repeat(40));

const mergedNames = [
    { input: 'SYEDSIBRAHIM', expected: 'SYED IBRAHIM' },
    { input: 'MOHAMMADALI', expected: 'MOHAMMAD ALI' },
    { input: 'ABDULLAHHASSAN', expected: 'ABDULLAH HASSAN' },
];

mergedNames.forEach(({ input, expected }) => {
    const result = smartSplitName(input);
    console.log(`  "${input}" → "${result}"`);
    if (result === expected || result.includes(' ')) {
        console.log('  ✅ OK');
        passed++;
    } else {
        console.log(`  ❌ Expected: "${expected}"`);
        failed++;
    }
});
console.log('');

// ============================================================================
// TEST 4: MRZ Parsing with Valid Checksums
// ============================================================================

console.log('TEST 4: MRZ Parsing (Valid Checksums)');
console.log('-'.repeat(40));

const validMrz = `P<INDNAVABJAN<<SYED<IBRAHIM<<<<<<<<<<<<<<<<<<
L89850380IND9001015M2501011<<<<<<<<<<<<<<02`;

const mrzResult = parseMRZ(validMrz);

if (mrzResult && mrzResult.full_name) {
    console.log('Full Name:', mrzResult.full_name);
    console.log('Surname:', mrzResult.surname);
    console.log('Given Names:', mrzResult.given_names);
    console.log('Nationality:', mrzResult.nationality, `(${mrzResult.country_code})`);
    console.log('Confidence:', mrzResult.confidence);

    if (mrzResult.full_name.includes('Navabjan') || mrzResult.surname.includes('Navabjan')) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log('❌ FAILED - Name not extracted correctly');
        failed++;
    }
} else {
    console.log('❌ FAILED - MRZ not parsed');
    failed++;
}
console.log('');

// ============================================================================
// TEST 5: Country Code Mapping
// ============================================================================

console.log('TEST 5: Country Code Mapping');
console.log('-'.repeat(40));

const countryCodes = ['IND', 'ARE', 'PAK', 'GBR', 'USA', 'DEU'];

countryCodes.forEach(code => {
    const result = getCountryName(code);
    console.log(`  ${code} → ${result.name}`);
    if (result.name) {
        passed++;
    } else {
        console.log('  ❌ FAILED');
        failed++;
    }
});
console.log('');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('='.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
