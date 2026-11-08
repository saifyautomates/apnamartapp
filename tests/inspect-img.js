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
  const imgPath = 'C:/Users/jackx/.gemini/antigravity/brain/0ce637a4-3b8b-44de-8e7f-c64be7e15c2d/.user_uploaded/media_1794149929892_7a7de445.png';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const ascii = await page.evaluate(async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        let lines = [];
        for (let y = 0; y < img.height; y += 2) {
          let line = '';
          for (let x = 0; x < img.width; x += 1) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // If near white/light grey:
            if (r > 200 && g > 200 && b > 200) line += '#';
            else if (g > r + 30 && g > b + 30) line += 'G'; // green
            else if (r > 150 && b > 200) line += 'P'; // purple border
            else if (r > 100 && g > 100 && b > 100) line += '.';
            else line += ' ';
          }
          lines.push(line);
        }
        resolve(lines.join('\n'));
      };
      img.src = 'data:image/png;base64,' + base64;
    });
  }, imgBase64);

  console.log(ascii);
  await browser.close();
}
run().catch(console.error);
