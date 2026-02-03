const { normalizeName } = require('./utils');

const cleanPart = (part) => {
    return (part || '')
        .replace(/[<LK]{2,}/g, ' ')
        .split(/[\s<LK]+/)
        .filter(p => p.length > 1)
        .join(' ');
};

const testCases = [
    { name: 'MUFEEDA<C<L<CLLLL<LLLLLLLL<LKLKL', expected: 'MUFEEDA C L' },
    { name: 'SYED<K<IBRAHIM<LLLLLL<LLLLLL', expected: 'SYED K IBRAHIM' },
    { name: 'VELUTHEDATH<<<<<<<<<<<<<<<<<<', expected: 'VELUTHEDATH' }
];

testCases.forEach(tc => {
    const cleaned = cleanPart(tc.name);
    const normalized = normalizeName(cleaned);
    console.log(`Input: ${tc.name}`);
    console.log(`Cleaned: ${cleaned}`);
    console.log(`Normalized: ${normalized}`);
    console.log('---');
});
