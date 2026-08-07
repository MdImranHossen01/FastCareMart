const fs = require('fs');
const path = require('path');

const replacements = [
  ['Fast Care Mart', 'Fast Care Mart'],
  ['Fast Care Mart', 'Fast Care Mart'],
  ['FastCareMart', 'FastCareMart'],
  ['FAST CARE MART', 'FAST CARE MART'],
  ['fastcaremart.com', 'fastcaremart.com'],
  ['FastCareMart.com', 'fastcaremart.com'],
  ['fastcaremart', 'fastcaremart'],
  ['support@FastCareMart.com', 'support@fastcaremart.com'],
  ['info@FastCareMart.com', 'info@fastcaremart.com']
];

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.md'];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next' && file !== '.git') {
      walkDir(fullPath);
    } else if (stat.isFile() && extensions.includes(path.extname(file))) {
      // Skip bd-locations.ts to prevent touching Bandarban locations
      if (file === 'bd-locations.ts') {
        return;
      }
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath.replace(process.cwd() + path.sep, ''));
      }
    }
  });
}

walkDir(process.cwd());
console.log('\nDone! Rebranding replacement finished.');
