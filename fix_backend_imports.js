const fs = require('fs');
const path = require('path');

function replaceInDirRegex(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDirRegex(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let origContent = content;
            
            // Replace imports pointing inside backend/core/... (except native and index.js) with backend/core/index.js
            content = content.replace(/(from\s+['"](?:.*\/)?backend\/core)\/(?!native\/|index\.js['"])[^'"]+(['"])/g, '$1/index.js$2');
            
            if (content !== origContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated imports in ${fullPath}`);
            }
        }
    }
}

replaceInDirRegex('C:/Users/leive/Proyectos/Weekbox/app/src/ui');

