const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../frontend/data.js'), 'utf8');
const objMatch = content.match(/const courseData = ({[\s\S]*?});/);
if (objMatch) {
    try {
        const obj = JSON.parse(objMatch[1]);
        for (let key in obj) {
            console.log(`${key}: ${obj[key].length} characters`);
        }
    } catch (e) {
        console.log('Error parsing JSON:', e.message);
        // Fallback: try to find keys manually
        const keys = content.match(/\"Apostila_[\w_]+\"/g);
        console.log('Found keys:', keys ? keys.length : 0);
    }
} else {
    console.log('Could not find courseData object');
}
