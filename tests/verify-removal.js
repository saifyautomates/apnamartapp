const puppeteer = require('puppeteer-core');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Verify that "12-15 Min Delivery" text is NOT on homepage
  const pageContent = await page.content();
  const hasFeatures = pageContent.includes('12-15 Min Delivery') || pageContent.includes('Best Wholesale Rates');
  console.log('Homepage contains QuickFeatures badges:', hasFeatures);

  await page.screenshot({ path: 'tests/homepage-after-removal.png' });
  console.log('Saved tests/homepage-after-removal.png');

  await browser.close();
}
run();

