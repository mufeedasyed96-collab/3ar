const { execSync } = require('child_process');
const fs = require('fs');

const files = ['passport.pdf', 'PPSYED.pdf', 'uae.pdf'];

files.forEach(file => {
    try {
        const output = execSync(`node index.js ${file}`, { encoding: 'utf8' });
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const json = output.substring(jsonStart, jsonEnd);
            fs.writeFileSync(`${file}_result.json`, json);
            console.log(`Captured output for ${file}`);
        } else {
            console.log(`No JSON found for ${file}`);
            console.log(output);
        }
    } catch (error) {
        console.error(`Failed to process ${file}:`, error.message);
    }
});
