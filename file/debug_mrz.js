const { extractTextFromPDF } = require('./ocr-engine');
const path = require('path');

async function debug(file) {
    try {
        const text = await extractTextFromPDF(path.resolve(file));
        console.log(`--- RAW TEXT FOR ${file} ---`);
        console.log(text);

        const lines = text.split('\n').map(l => l.trim().replace(/\s/g, ''));
        lines.forEach((line, i) => {
            if (line.startsWith('P<')) {
                console.log(`MRZ Line 1: ${line}`);
                if (i + 1 < lines.length) console.log(`MRZ Line 2: ${lines[i + 1]}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

const file = process.argv[2];
if (file) debug(file);
