const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const outputFilePath = path.join(__dirname, 'data.js');

let dataObj = {};

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    
    files.forEach((file) => {
        if (file.endsWith('.md') && file !== 'implementation_plan.md') {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            dataObj[file.replace('.md', '')] = content;
        }
    });

    const fileContent = `const courseData = ${JSON.stringify(dataObj, null, 2)};`;
    
    fs.writeFileSync(outputFilePath, fileContent, 'utf8');
    console.log('data.js generated successfully!');
});
