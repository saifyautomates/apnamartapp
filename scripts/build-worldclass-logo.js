const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Central Mart Signature Shopping Bag + Fresh Leaf Pure Vector Icon
const svgVectorIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <!-- Arched Tote Bag Handle -->
  <path d="M176 180 C176 116 212 68 256 68 C300 68 336 116 336 180" stroke="#0c831f" stroke-width="36" stroke-linecap="round" fill="none" />
  
  <!-- Grocery Tote Bag Body with gentle taper -->
  <path d="M106 164 C94 164 85 174 87 186 L122 434 C124 448 136 458 150 458 L362 458 C376 458 388 448 390 434 L425 186 C427 174 418 164 406 164 Z" fill="#0c831f" />
  
  <!-- Subtle Bag Lip Highlight -->
  <path d="M102 176 L410 176" stroke="#16a34a" stroke-width="8" stroke-linecap="round" />
  
  <!-- Organic White Fresh Leaf Emblem in Center -->
  <path d="M256 220 C202 220 166 262 166 314 C166 366 218 390 270 378 C322 366 346 314 346 262 C346 236 296 220 256 220 Z" fill="#ffffff" />
  
  <!-- Fresh Leaf Midrib Line -->
  <path d="M184 344 C232 312 274 274 326 242" stroke="#0c831f" stroke-width="18" stroke-linecap="round" />
</svg>`;

// Helper to create 32-bit ARGB multi-resolution ICO
function createIco(frames) {
  const count = frames.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const img of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count (0 = 256 or more)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset into file
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...frames.map((f) => f.buffer)]);
}

async function buildAllIcons() {
  console.log("=== BUILDING WORLD-CLASS TRANSPARENT EMBLEM FAVICONS & ICONS ===");

  const pub = path.join(__dirname, "..", "public");
  const iconsDir = path.join(pub, "icons");

  // 1. Save pure vector SVG favicon
  fs.writeFileSync(path.join(pub, "favicon.svg"), svgVectorIcon, "utf-8");
  console.log("✓ Saved public/favicon.svg (pure vector SVG)");

  // Launch Chromium to render pixel-perfect transparent PNGs
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(`<!DOCTYPE html>
  <html>
    <head>
      <style>
        body, html { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        svg { display: block; width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      ${svgVectorIcon}
    </body>
  </html>`);

  // Target render resolutions
  const targets = [
    { file: path.join(pub, "favicon-16x16.png"), size: 16 },
    { file: path.join(pub, "favicon-32x32.png"), size: 32 },
    { file: path.join(pub, "favicon.png"), size: 48 },
    { file: path.join(iconsDir, "apple-touch-icon.png"), size: 180 },
    { file: path.join(iconsDir, "icon-192.png"), size: 192 },
    { file: path.join(iconsDir, "icon-512.png"), size: 512 },
    { file: path.join(iconsDir, "central-mart-icon.png"), size: 512 },
  ];

  const buffers = {};
  for (const t of targets) {
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
    const buf = await page.screenshot({ omitBackground: true, type: "png" });
    fs.writeFileSync(t.file, buf);
    buffers[t.size] = buf;
    console.log(`✓ Saved ${path.relative(pub, t.file)} (${t.size}x${t.size}, ${buf.length} bytes, 100% transparent)`);
  }

  // 2. Build multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: buffers[16] },
    { width: 32, height: 32, buffer: buffers[32] },
    { width: 48, height: 48, buffer: buffers[48] },
  ]);

  fs.writeFileSync(path.join(pub, "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(__dirname, "..", "src", "app", "favicon.ico"), icoBuffer);
  console.log(`✓ Saved public/favicon.ico & src/app/favicon.ico (${icoBuffer.length} bytes, 32-bit ARGB multi-resolution)`);

  // 3. Render PWA maskable full-bleed icon
  const pageMaskable = await browser.newPage();
  await pageMaskable.setContent(`<!DOCTYPE html>
  <html>
    <head>
      <style>
        body, html { margin: 0; padding: 0; background: #0c831f; overflow: hidden; width: 512px; height: 512px; }
        .wrapper { width: 410px; height: 410px; margin: 51px auto; }
        svg { display: block; width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        ${svgVectorIcon}
      </div>
    </body>
  </html>`);
  await pageMaskable.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  const maskableBuf = await pageMaskable.screenshot({ type: "png" });
  fs.writeFileSync(path.join(iconsDir, "maskable-512.png"), maskableBuf);
  console.log("✓ Saved public/icons/maskable-512.png (512x512 full-bleed emerald maskable)");

  await browser.close();
  console.log("\n========================================================");
  console.log("🎉 ALL EMBLEM FAVICONS AND ICONS BUILT WITH 100% SUCCESS!");
  console.log("========================================================\n");
}

buildAllIcons().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

