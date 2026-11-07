const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function debugScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing open-search-modal...');
  const res = await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-search-modal', { detail: { query: 'Milk' } }));
    return document.body.innerHTML.includes('Search');
  });
  console.log('DOM updated?', res);

  await new Promise(r => setTimeout(r, 1000));
  const html = await page.evaluate(() => document.querySelector('aside, [role="dialog"], [aria-label*="Search"]')?.outerHTML || 'NOT FOUND');
  console.log('Found modal element:', html.substring(0, 300));

  await browser.close();
}

debugScreenshots().catch(console.error);

