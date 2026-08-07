const fs = require('fs');
const path = require('path');

const replacements = [
  ['x Apparels Atelier', 'Fast Care Mart Atelier'],
  ['x Apparels Boutique', 'Fast Care Mart Boutique'],
  ['x Apparels Curators', 'Fast Care Mart Curators'],
  ['x Apparels Intelligence', 'Fast Care Mart Intelligence'],
  ['x Apparels Editorial', 'Fast Care Mart Editorial'],
  ['x Apparels Assistant', 'Fast Care Mart Assistant'],
  ['x Apparels CO.', 'Fast Care Mart CO.'],
  ['x Apparels Team', 'Fast Care Mart Team'],
  ['x Apparels AI', 'Fast Care Mart AI'],
  ['x Apparelsr', 'Fast Care Mart'],  // typo fix in manifest.ts
  ['x Apparels', 'Fast Care Mart'],
  ['xApparels', 'FastCareMart'],
  ['xapparels.com', 'fastcaremart.com'],
  ['xapparels', 'fastcaremart'],
];

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      walkDir(fullPath);
    } else if (stat.isFile() && extensions.includes(path.extname(file))) {
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

walkDir(path.join(process.cwd(), 'src'));
console.log('\nDone! All branding updated.');
