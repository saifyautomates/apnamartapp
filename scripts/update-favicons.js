const fs = require('fs');

// 1. Generate multi-resolution ICO from 16, 32, 48 PNGs
const p16 = fs.readFileSync('public/favicon-16x16.png');
const p32 = fs.readFileSync('public/favicon-32x32.png');
const p48 = fs.readFileSync('public/favicon.png');

const frames = [
  { width: 16, height: 16, buffer: p16 },
  { width: 32, height: 32, buffer: p32 },
  { width: 48, height: 48, buffer: p48 }
];

const count = frames.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(count, 4);

let offset = 6 + count * 16;
const entries = [];
for (const item of frames) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
  entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(item.buffer.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += item.buffer.length;
}

const icoBuffer = Buffer.concat([header, ...entries, ...frames.map(f => f.buffer)]);
fs.writeFileSync('public/favicon.ico', icoBuffer);
fs.writeFileSync('src/app/favicon.ico', icoBuffer);
console.log('Saved public/favicon.ico & src/app/favicon.ico, size:', icoBuffer.length);

// 2. Generate clean favicon.svg
const p512 = fs.readFileSync('public/icons/icon-512.png');
const b64 = p512.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <style>:root { --brand-primary: #0c831f; }</style>
  </defs>
  <image href="data:image/png;base64,${b64}" width="512" height="512" />
</svg>`;
fs.writeFileSync('public/favicon.svg', svg, 'utf8');
console.log('Saved public/favicon.svg');
