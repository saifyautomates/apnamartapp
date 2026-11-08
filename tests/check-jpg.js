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
  const b64 = fs.readFileSync('public/images/branding/central-mart-logo.jpg').toString('base64');
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
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const corner = [data[0], data[1], data[2], data[3]];
        resolve({ w: img.width, h: img.height, corner });
      };
      img.src = 'data:image/jpeg;base64,' + data;
    });
  }, b64);
  console.log('central-mart-icon.jpg:', res);
  await browser.close();
}
run();
