const { execSync } = require('child_process');
const fs = require('fs');

const files = ['passport.pdf', 'PPSYED.pdf', 'uae.pdf', 'pp.png', 'ppp.png', 'mp.png'];

files.forEach(file => {
    try {
        const output = execSync(`node index.js ${file}`, { encoding: 'utf8' });
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const json = output.substring(jsonStart, jsonEnd);
            fs.writeFileSync(`${file}_final.json`, json);
            console.log(`Captured output for ${file}`);
        }
    } catch (error) { }
});
