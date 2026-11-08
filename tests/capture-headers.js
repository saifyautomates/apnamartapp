const puppeteer = require('puppeteer-core');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  
  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const desktopHeader = await page.$('header');
  if (desktopHeader) {
    await desktopHeader.screenshot({ path: 'tests/header-desktop.png' });
    console.log('Saved tests/header-desktop.png');
  }

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const mobileHeader = await page.$('header');
  if (mobileHeader) {
    await mobileHeader.screenshot({ path: 'tests/header-mobile.png' });
    console.log('Saved tests/header-mobile.png');
  }

  await browser.close();
}
run();

