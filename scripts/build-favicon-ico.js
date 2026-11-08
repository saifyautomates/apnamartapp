const fs = require("fs");
const path = require("path");

function createIco(images) {
  // images is array of { width, height, buffer }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(images.length, 4); // count

  let offset = 6 + 16 * images.length;
  const dirEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count (0 = 256 or more)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel (32-bit ARGB)
    entry.writeUInt32LE(img.buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset into file
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map((i) => i.buffer)]);
}

const pub = path.join(__dirname, "..", "public");

const png16 = fs.readFileSync(path.join(pub, "favicon-16x16.png"));
const png32 = fs.readFileSync(path.join(pub, "favicon-32x32.png"));
const png48 = fs.readFileSync(path.join(pub, "favicon.png"));

const icoBuffer = createIco([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 48, height: 48, buffer: png48 },
]);

fs.writeFileSync(path.join(pub, "favicon.ico"), icoBuffer);
console.log("Successfully created 32-bit multi-resolution transparent favicon.ico! Size:", icoBuffer.length, "bytes");

