const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  const icoBuf = fs.readFileSync('public/favicon.ico');
  const b64 = icoBuf.toString('base64');
  await page.setContent(`<!DOCTYPE html><html><body style="background:#2b1d28; padding:20px;">
    <h2 style="color:white">Favicon.ico frames</h2>
    <div style="background:#2b1d28; padding:20px; display:inline-block; border: 2px solid purple; border-radius: 20px;">
      <img id="icoImg" src="data:image/x-icon;base64,${b64}" style="width:48px;height:48px;" />
      <span style="color:white; font-family:sans-serif; font-size: 20px; margin-left: 10px;">Central Mart</span>
    </div>
  </body></html>`);
  
  await page.screenshot({ path: 'tests/favicon-preview-dark.png' });
  console.log('Saved tests/favicon-preview-dark.png');
  await browser.close();
}
run();

