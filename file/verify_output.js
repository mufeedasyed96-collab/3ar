const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('node index.js passport.pdf', { encoding: 'utf8' });
    // Find the JSON part
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
        const json = output.substring(jsonStart, jsonEnd);
        fs.writeFileSync('verify_results.txt', json, 'utf8');
        console.log('Result saved to verify_results.txt');
    } else {
        fs.writeFileSync('verify_results.txt', 'No JSON found:\n' + output, 'utf8');
    }
} catch (error) {
    fs.writeFileSync('verify_results.txt', 'Error: ' + error.message, 'utf8');
}
