const fs = require('fs');
const path = require('path');

function getFiles(dir, allFiles) {
    const files = fs.readdirSync(dir);
    allFiles = allFiles || [];
    files.forEach(function (file) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, allFiles);
        } else {
            if (name.endsWith('.json') && !name.includes('index') && !name.includes('summary')) {
                allFiles.push({
                    name: name,
                    size: fs.statSync(name).size
                });
            }
        }
    });
    return allFiles;
}

const templatesDir = 'c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\n8n-template-finder\\templates';
const allFiles = getFiles(templatesDir);
allFiles.sort((a, b) => b.size - a.size);

console.log("TOP 10 LARGEST WORKFLOWS:");
allFiles.slice(0, 10).forEach(f => {
    console.log(`${f.size} bytes - ${f.name}`);
});
