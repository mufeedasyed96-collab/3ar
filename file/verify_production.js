const { execSync } = require('child_process');
const fs = require('fs');

const files = ['passport.pdf', 'PPSYED.pdf', 'pp.png', 'ppp.png', 'mp.png'];

console.log('='.repeat(60));
console.log('PRODUCTION MRZ PARSER VERIFICATION');
console.log('='.repeat(60));
console.log('');

files.forEach(file => {
    try {
        console.log(`Processing: ${file}`);
        console.log('-'.repeat(40));
        const output = execSync(`node index.js ${file}`, { encoding: 'utf8' });
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const json = JSON.parse(output.substring(jsonStart, jsonEnd));
            console.log('Full Name:', json.full_name);
            console.log('Surname:', json.surname);
            console.log('Given Names:', json.given_names);
            console.log('Nationality:', `${json.nationality} (${json.nationality_code})`);
            console.log('Data Source:', json.data_source);
            console.log('Warnings:', json.warnings && json.warnings.length > 0 ? json.warnings.join(', ') : 'None');
        }
        console.log('');
    } catch (error) {
        console.log('Error:', error.message);
        console.log('');
    }
});
