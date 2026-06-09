const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../content');
const outputFilePath = path.join(__dirname, '../frontend/data.js');

let dataObj = {};

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    
    const ignoredFiles = [
        'implementation_plan.md',
        'task.md',
        'walkthrough.md',
        'manual_novas_unidades.md',
        'readme.md'
    ];

    files.forEach((file) => {
        if (file.endsWith('.md') && !ignoredFiles.includes(file.toLowerCase())) {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            dataObj[file.replace('.md', '')] = content;
        }
    });

    const fileContent = `const courseData = ${JSON.stringify(dataObj, null, 2)};`;
    
    fs.writeFileSync(outputFilePath, fileContent, 'utf8');
    console.log('data.js generated successfully!');
});
