const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('node test.js', { encoding: 'utf8' });
    fs.writeFileSync('test_results.txt', output);
    console.log('Test results written to test_results.txt');
} catch (error) {
    fs.writeFileSync('test_results.txt', error.stdout + '\n' + error.stderr);
    console.log('Test failed, check test_results.txt');
}
