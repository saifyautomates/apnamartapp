const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const exe = edgePaths.find(p => fs.existsSync(p));
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('public/icons/maskable-512.png').toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const res = await page.evaluate(async (data) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height).data;
        resolve({ w: img.width, h: img.height, corner: [d[0], d[1], d[2], d[3]] });
      };
      img.src = 'data:image/png;base64,' + data;
    });
  }, b64);
  console.log('maskable-512.png:', res);
  await browser.close();
}
run();

