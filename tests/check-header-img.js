const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('tests/header-desktop.png').toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const check = await page.evaluate(async (data) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // Let's get dimensions and check if there's any square white box around the logo
        resolve({ w: img.width, h: img.height });
      };
      img.src = 'data:image/png;base64,' + data;
    });
  }, b64);
  console.log('header-desktop check:', check);
  await browser.close();
}
run();

