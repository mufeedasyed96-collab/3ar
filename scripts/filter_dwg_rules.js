const fs = require('fs');
const vm = require('vm');

// Read the config file
const content = fs.readFileSync('./config/config_roads.js', 'utf8');

// Create a context to evaluate the module
const context = { module: { exports: {} }, exports: {} };
context.exports = context.module.exports;

// Execute the config file
vm.runInNewContext(content, context);

const ROAD_ARTICLES = context.module.exports.ROAD_ARTICLES;

// Filter to only include DWG-checkable rules
const filteredArticles = ROAD_ARTICLES
    .map(article => {
        const dwgRules = (article.rules || []).filter(r => r.dwg_checkable === true || r.dwg_checkable === 'partial');
        if (dwgRules.length === 0) return null;
        return {
            ...article,
            rules: dwgRules
        };
    })
    .filter(a => a !== null);

// Generate the filtered config file
const output = `/**
 * FILTERED Configuration for Road geometry validation - DWG Checkable Rules Only
 * Source: Road Geometric Design Manual (TR-514 / Second Edition - January 2022)
 * This file only contains rules that can be validated from DWG files.
 * Generated from config_roads.js
 * 
 * Summary:
 * - Total articles: ${filteredArticles.length} (R1 removed - requires project metadata)
 * - Total DWG-checkable rules: ${filteredArticles.reduce((sum, a) => sum + a.rules.length, 0)}
 */

const ROAD_ARTICLES_DWG = ${JSON.stringify(filteredArticles, null, 4)};

module.exports = {
    ROAD_ARTICLES_DWG
};
`;

fs.writeFileSync('./config/config_roads_dwg.js', output);
console.log('Created config_roads_dwg.js');
console.log('- Articles: ' + filteredArticles.length);
console.log('- DWG-checkable rules: ' + filteredArticles.reduce((sum, a) => sum + a.rules.length, 0));
