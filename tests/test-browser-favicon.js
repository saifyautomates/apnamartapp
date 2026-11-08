const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage();
  
  const iconUrls = [];
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('icon') || url.includes('favicon')) {
      iconUrls.push({ url, status: res.status() });
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('Icons fetched during page load:');
  console.log(iconUrls);

  // Check what icon links are in document.head
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l => ({
      rel: l.rel,
      href: l.href,
      type: l.type,
      sizes: l.sizes ? l.sizes.value : null
    }));
  });
  console.log('\nDocument head icon links:');
  console.log(links);

  await browser.close();
}
run();

