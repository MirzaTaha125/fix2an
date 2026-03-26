const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'Frontend', 'src', 'pages');

const bottomNavTags = [
    /<WorkshopBottomNav \/>/g,
    /<CustomerBottomNav \/>/g,
    /<GuestBottomNav \/>/g,
    /import WorkshopBottomNav from '\.\.\/components\/WorkshopBottomNav'/g,
    /import CustomerBottomNav from '\.\.\/components\/CustomerBottomNav'/g,
    /import GuestBottomNav from '\.\.\/components\/GuestBottomNav'/g,
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            for (const regex of bottomNavTags) {
                content = content.replace(regex, '');
            }
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

processDir(pagesDir);
console.log('Script completed.');
