/**
 * ============================================================================
 * MRZ Parser Test Suite
 * ============================================================================
 * 
 * Tests the MRZ parser with various noise patterns to ensure robust
 * name extraction from corrupted OCR output.
 * 
 * Run with: node mrz-test.js
 * ============================================================================
 */

const { parseMRZ, normalizeMrzName, cleanMrzPart } = require('./mrz-parser');

// ============================================================================
// TEST CASES
// ============================================================================

const testCases = [
    {
        name: 'Standard MRZ with C noise (common OCR error)',
        input: `P<INDNAVABJANCCCCCC<<SYEDSIBRAHIMCCCCCC<<<<<<
5656058<2IND8007236M2501012<<<<<<<<<<<<<<06`,
        expected: {
            full_name: 'Syed Ibrahim Navabjan',
            surname: 'Navabjan',
            given_names: 'Syed Ibrahim',
            nationality_code: 'IND',
            nationality: 'India'
        }
    },
    {
        name: 'UAE Passport with clean MRZ',
        input: `P<AREALSAMPLE<<MOHAMMED<AHMED<<<<<<<<<<<<<<<<
A00000000ARE0001014M2501012<<<<<<<<<<<<<<04`,
        expected: {
            full_name: 'Mohammed Ahmed Alsample',
            surname: 'Alsample',
            given_names: 'Mohammed Ahmed',
            nationality_code: 'ARE',
            nationality: 'United Arab Emirates'
        }
    },
    {
        name: 'Indian Passport with L noise',
        input: `P<INDVELUTHEDATHLLLLL<<MUFEEDALLLL<<<<<<<<<
T1234567<8IND9001010F2501010<<<<<<<<<<<<<<02`,
        expected: {
            full_name: 'Mufeeda Veluthedath',
            surname: 'Veluthedath',
            given_names: 'Mufeeda',
            nationality_code: 'IND',
            nationality: 'India'
        }
    },
    {
        name: 'Mixed noise pattern (C and L)',
        input: `P<PAKKHANCLLCC<<MOHAMMADCCCLLIBRAHIM<<<<<<
P1234567<0PAK8505050M2501015<<<<<<<<<<<<<<08`,
        expected: {
            full_name: 'Mohammad Ibrahim Khan',
            surname: 'Khan',
            given_names: 'Mohammad Ibrahim',
            nationality_code: 'PAK',
            nationality: 'Pakistan'
        }
    }
];

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('='.repeat(60));
console.log('MRZ PARSER TEST SUITE');
console.log('='.repeat(60));
console.log('');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(40));

    const result = parseMRZ(testCase.input);

    if (!result) {
        console.log('❌ FAILED: MRZ not detected');
        failed++;
        console.log('');
        return;
    }

    console.log('Input MRZ Raw Name:', result.mrz_raw_name_field);
    console.log('');
    console.log('Extracted:');
    console.log('  Full Name:', result.full_name);
    console.log('  Surname:', result.surname);
    console.log('  Given Names:', result.given_names);
    console.log('  Nationality:', `${result.nationality} (${result.nationality_code})`);
    console.log('  Warnings:', result.warnings.length > 0 ? result.warnings.join(', ') : 'None');
    console.log('');

    // Simplified validation (check key fields)
    const nameMatch = result.full_name.toLowerCase().includes(testCase.expected.full_name.split(' ')[0].toLowerCase());
    const natMatch = result.nationality === testCase.expected.nationality;

    if (nameMatch && natMatch) {
        console.log('✅ PASSED');
        passed++;
    } else {
        console.log('❌ FAILED');
        console.log('  Expected name contains:', testCase.expected.full_name.split(' ')[0]);
        console.log('  Expected nationality:', testCase.expected.nationality);
        failed++;
    }

    console.log('');
});

console.log('='.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

// ============================================================================
// DIRECT NORMALIZATION TEST
// ============================================================================

console.log('');
console.log('Direct Normalization Test:');
console.log('-'.repeat(40));

const corruptedName = 'SYEDSIBRAHIMCCCCCC NAVABJANC';
const normalizedName = normalizeMrzName(corruptedName);

console.log('Input:', corruptedName);
console.log('Output:', normalizedName);
console.log('');

if (normalizedName.toLowerCase().includes('syed') && normalizedName.toLowerCase().includes('navabjan')) {
    console.log('✅ Normalization working correctly');
} else {
    console.log('❌ Normalization needs adjustment');
}
