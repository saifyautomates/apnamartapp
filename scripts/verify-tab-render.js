const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 80, deviceScaleFactor: 2 });
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 16px;
          background: #1b1420;
          display: flex;
          align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
          color: #ffffff;
        }
        .tab-preview {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #2b2233;
          border-radius: 8px 8px 0 0;
          padding: 8px 16px;
          border-bottom: 2px solid #0c831f;
        }
        .tab-preview img {
          width: 20px;
          height: 20px;
          object-fit: contain;
          display: block;
        }
        .title {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
      </style>
    </head>
    <body>
      <div class="tab-preview">
        <img src="http://localhost:3000/favicon-32x32.png?v=20261108" />
        <span class="title">Central Mart — Kota...</span>
      </div>
    </body>
    </html>
  `);

  await page.screenshot({ path: 'tab_render_verification.png' });
  console.log('Saved tab_render_verification.png');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

