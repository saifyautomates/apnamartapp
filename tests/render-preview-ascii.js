const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('tests/favicon-preview-dark.png').toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const ascii = await page.evaluate(async (data) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height).data;
        // Let's sample a 60x60 region around the icon
        // Icon is at around x=30, y=70
        let lines = [];
        for (let y = 60; y < 130; y += 2) {
          let line = '';
          for (let x = 20; x < 90; x += 1) {
            const idx = (y * img.width + x) * 4;
            const r = d[idx], g = d[idx+1], b = d[idx+2];
            if (r > 200 && g > 200 && b > 200) line += '#';
            else if (g > r + 30 && g > b + 30) line += 'G';
            else if (r > 100 && b > 100 && g < 50) line += 'P';
            else line += ' ';
          }
          lines.push(line);
        }
        resolve(lines.join('\n'));
      };
      img.src = 'data:image/png;base64,' + data;
    });
  }, b64);
  console.log(ascii);
  await browser.close();
}
run();

