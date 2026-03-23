const fs = require('fs');
const path = require('path');

const targetDir = 'j:\\work\\Fixa2an-main\\fixa2an-main\\Frontend\\src\\pages';

function traverse(dir) {
	fs.readdirSync(dir).forEach(file => {
		let fullPath = path.join(dir, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			traverse(fullPath);
		} else if (fullPath.endsWith('.jsx') && !fullPath.includes('HomePage.jsx')) { // Avoid HomePage if it has huge hero headers
			let content = fs.readFileSync(fullPath, 'utf8');
			
			// Replace text-2xl, text-3xl, text-4xl with text-xl inside h1 and h2
			let modified = content.replace(/<(h1|h2)([^>]*)className=["']([^"']*)["']([^>]*)>/g, (match, tag, before, className, after) => {
				let newClassName = className.replace(/\b(sm:|md:|lg:|xl:)?text-(2xl|3xl|4xl|5xl|h[1-6])\b/g, '$1text-xl');
				if (!newClassName.includes('text-xl')) {
                     newClassName = 'text-xl ' + newClassName;
                }
				
				let uniqueClasses = [...new Set(newClassName.split(/\s+/))].join(' ');
				return `<${tag}${before}className="${uniqueClasses}"${after}>`;
			});

			if (content !== modified) {
				fs.writeFileSync(fullPath, modified, 'utf8');
				console.log('Updated', fullPath);
			}
		}
	});
}

traverse(targetDir);
console.log('Done');
