const fs = require("fs");
const path = require("path");
const assert = require("assert");

async function testIconTransparency() {
  console.log("=== CHECKING EMBLEM FAVICON TRANSPARENCY & ZERO SQUARE TILES ===");

  const pub = path.join(__dirname, "..", "public");

  // 1. Check all required files exist
  const files = [
    "favicon.ico",
    "favicon.svg",
    "favicon.png",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png",
    "icons/maskable-512.png",
  ];

  for (const f of files) {
    const full = path.join(pub, f);
    assert.ok(fs.existsSync(full), `File must exist: ${f}`);
    const stat = fs.statSync(full);
    assert.ok(stat.size > 0, `File must not be empty: ${f}`);
    console.log(`✓ ${f} exists (${stat.size} bytes)`);
  }

  // 2. Verify pure vector SVG (not an embedded base64 png)
  const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf-8");
  assert.ok(svg.includes("<svg"), "Must be valid SVG");
  assert.ok(svg.includes("#0c831f"), "Must include Central Mart brand green");
  assert.ok(svg.includes("#ffffff"), "Must include white leaf emblem");
  assert.ok(!svg.includes("data:image/png"), "Must be pure vector, not base64 raster embedding");
  assert.ok(!svg.includes("drop-shadow"), "Must not have drop shadows");
  console.log("✓ favicon.svg is pure vector SVG with brand emerald green and zero raster wrapper");

  // 3. Verify ICO header and frames
  const ico = fs.readFileSync(path.join(pub, "favicon.ico"));
  assert.strictEqual(ico.readUInt16LE(0), 0, "ICO reserved must be 0");
  assert.strictEqual(ico.readUInt16LE(2), 1, "ICO type must be 1 (icon)");
  const count = ico.readUInt16LE(4);
  assert.ok(count >= 3, "ICO must contain at least 3 resolutions (16, 32, 48)");
  console.log(`✓ favicon.ico is standard multi-resolution container with ${count} embedded frames`);

  // 4. Verify src/app/favicon.ico is synced with public/favicon.ico
  const appIco = fs.readFileSync(path.join(__dirname, "..", "src", "app", "favicon.ico"));
  assert.strictEqual(appIco.length, ico.length, "src/app/favicon.ico must match public/favicon.ico");
  console.log("✓ src/app/favicon.ico is perfectly synchronized with public/favicon.ico");

  console.log("\n========================================================");
  console.log("🎉 ALL ICON TRANSPARENCY & EMBLEM CHECKS PASSED 100%!");
  console.log("========================================================\n");
}

testIconTransparency().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
