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
  const b64 = fs.readFileSync('public/icons/central-mart-icon.jpg').toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const ascii = await page.evaluate(async (data) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        const d = ctx.getImageData(0, 0, 64, 64).data;
        let lines = [];
        for (let y = 0; y < 64; y += 2) {
          let line = '';
          for (let x = 0; x < 64; x += 1) {
            const idx = (y * 64 + x) * 4;
            const r = d[idx], g = d[idx+1], b = d[idx+2];
            if (r > 230 && g > 230 && b > 230) line += ' '; // white
            else if (g > r && g > b) line += 'G'; // green
            else if (r > 150 && g < 100) line += 'R'; // red
            else if (r > 150 && g > 100 && b < 100) line += 'Y'; // yellow/orange
            else line += '.';
          }
          lines.push(line);
        }
        resolve(lines.join('\n'));
      };
      img.src = 'data:image/jpeg;base64,' + data;
    });
  }, b64);
  console.log(ascii);
  await browser.close();
}
run();

