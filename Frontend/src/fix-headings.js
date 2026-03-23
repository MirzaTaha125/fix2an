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
			// Actually we can just apply a regex to replace these classes inside any <h1 or <h2 className=""
			let modified = content.replace(/<(h1|h2)([^>]*)className=["']([^"']*)["']([^>]*)>/g, (match, tag, before, className, after) => {
				// Replace sm:text-4xl, md:text-3xl, text-2xl etc with text-xl
				let newClassName = className.replace(/\b(sm:|md:|lg:|xl:)?text-(2xl|3xl|4xl|5xl|h[1-6])\b/g, '$1text-xl');
				// if there's no text-xl but there was one replaced, $1 will preserve the prefix (like sm:text-xl)
				// Ensure text-xl is present and remove duplicates
				if (!newClassName.includes('text-xl')) {
                     newClassName = 'text-xl ' + newClassName;
                }
				
				// Optional: she said 1.25rem which is text-xl. Let's just make sure text-xl exists.
				// Wait, if it already had text-xl it might end up with `text-xl text-xl`.
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
