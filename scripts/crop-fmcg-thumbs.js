const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  const userImg = "C:/Users/jackx/.gemini/antigravity/brain/051c239f-0b90-407b-92fc-13981b4066bc/.user_uploaded/media_1794059005988_aa432026.jpg";
  const b64 = fs.readFileSync(userImg).toString("base64");

  await page.setContent(`
    <html>
      <body style="margin:0;padding:0;">
        <canvas id="c"></canvas>
      </body>
    </html>
  `);

  const crops = [
    // Right phone (X range roughly 530 to 1000 in a ~1080x1200 image)
    // Let's first inspect dimensions
    { name: "atta", label: "Aashirvaad Atta" },
    { name: "salt", label: "Tata Salt" },
    { name: "oil", label: "Fortune Oil" },
    { name: "surf", label: "Surf Excel" },
  ];

  const results = await page.evaluate(async (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        // In media_1794059005988_aa432026.jpg, right phone is from x ~ 530 to 1040
        // Item 1 Atta: x around 550, y around 335, size ~ 110x125
        // Item 2 Salt: x around 550, y around 500, size ~ 110x115
        // Item 3 Oil: x around 565, y around 650, size ~ 85x125
        // Item 4 Surf: x around 555, y around 815, size ~ 105x125
        const c = document.getElementById("c");
        const ctx = c.getContext("2d");

        function getCrop(x, y, cw, ch) {
          c.width = cw;
          c.height = ch;
          ctx.drawImage(img, x, y, cw, ch, 0, 0, cw, ch);
          return c.toDataURL("image/jpeg", 0.92);
        }

        // Proportional to image width and height
        const scaleX = w / 1000;
        const scaleY = h / 1100;

        const atta = getCrop(550 * scaleX, 335 * scaleY, 115 * scaleX, 125 * scaleY);
        const salt = getCrop(550 * scaleX, 500 * scaleY, 115 * scaleX, 120 * scaleY);
        const oil = getCrop(565 * scaleX, 650 * scaleY, 85 * scaleX, 130 * scaleY);
        const surf = getCrop(555 * scaleX, 815 * scaleY, 110 * scaleX, 125 * scaleY);

        resolve({ w, h, atta, salt, oil, surf });
      };
      img.src = dataUri;
    });
  }, "data:image/jpeg;base64," + b64);

  console.log("Image dimensions:", results.w, "x", results.h);

  function saveB64(dataUri, dest) {
    const raw = dataUri.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    console.log("Saved crop:", dest);
  }

  const outDir = path.join(__dirname, "..", "public", "images", "products");
  saveB64(results.atta, path.join(outDir, "aashirvaad-shudh-chakki-atta.jpg"));
  saveB64(results.salt, path.join(outDir, "tata-salt-iodised.jpg"));
  saveB64(results.oil, path.join(outDir, "fortune-sunflower-oil.jpg"));
  saveB64(results.surf, path.join(outDir, "surf-excel-easy-wash-detergent-powder.jpg"));

  await browser.close();
}

run().catch(console.error);

