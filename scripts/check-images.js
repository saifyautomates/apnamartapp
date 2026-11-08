const fs = require('fs');
const path = require('path');

const diskFiles = fs.readdirSync(path.join(process.cwd(), 'public/images/products'));
console.log('Total files on disk in public/images/products:', diskFiles.length);

// Read file text
const content = fs.readFileSync('src/lib/fmcg-catalog.ts', 'utf8');
const regex = /name:\s*"([^"]+)",\s*brand:/g;
let match;
const items = [];
while ((match = regex.exec(content)) !== null) {
  items.push(match[1]);
}

console.log('Total FMCG items found:', items.length);

const missing = [];
const matched = [];

for (const name of items) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const exact = slug + '.jpg';
  if (diskFiles.includes(exact)) {
    matched.push({ name, file: exact });
  } else {
    // Find partial
    const partial = diskFiles.find(f => {
      const base = f.replace('.jpg', '');
      return slug.includes(base) || base.includes(slug);
    });
    missing.push({ name, slug, partial });
  }
}

console.log('Matched:', matched.length);
console.log('Missing:', missing.length);
console.log('Details of missing items:\n', JSON.stringify(missing, null, 2));
