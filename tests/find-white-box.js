const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const exe = edgePaths.find(p => fs.existsSync(p));
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();

  const filesToCheck = [
    'public/favicon.ico',
    'public/favicon.png',
    'public/favicon-16x16.png',
    'public/favicon-32x32.png',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/icons/apple-touch-icon.png',
    'public/icons/central-mart-icon.png',
    'src/app/favicon.ico'
  ];

  for (const rel of filesToCheck) {
    const full = path.resolve(rel);
    if (!fs.existsSync(full)) continue;
    const ext = path.extname(full).toLowerCase();
    let mime = 'image/png';
    if (ext === '.ico') mime = 'image/x-icon';
    if (ext === '.svg') mime = 'image/svg+xml';
    const base64 = fs.readFileSync(full).toString('base64');
    const uri = `data:${mime};base64,${base64}`;

    const check = await page.evaluate(async (dataUri) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, img.width, img.height).data;
          
          // Check corner pixel (0,0) and border pixels
          const cornerR = data[0], cornerG = data[1], cornerB = data[2], cornerA = data[3];
          
          let opaqueWhiteCount = 0;
          let transparentCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i+3];
            const r = data[i], g = data[i+1], b = data[i+2];
            if (a === 0) transparentCount++;
            else if (r > 240 && g > 240 && b > 240) opaqueWhiteCount++;
          }
          resolve({
            w: img.width,
            h: img.height,
            corner: [cornerR, cornerG, cornerB, cornerA],
            transparentCount,
            opaqueWhiteCount,
            totalPixels: img.width * img.height
          });
        };
        img.onerror = () => resolve(null);
        img.src = dataUri;
      });
    }, uri);

    console.log(rel, check);
  }

  await browser.close();
}
run().catch(console.error);

