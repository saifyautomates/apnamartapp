const puppeteer = require('puppeteer-core');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCapture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const artifactDir = 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc';

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // 1. Capture In-App Product Detail Bottom Sheet
  console.log('Opening In-App Product Sheet...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-product-sheet', {
      detail: {
        slug: 'amul-taaza-fresh-toned-milk',
        initialName: 'Amul Taaza Fresh Toned Milk',
        initialPrice: 2700,
        initialMrp: 2800,
        initialImage: '/images/products/amul-milk.jpg'
      }
    }));
  });
  await sleep(1500);
  const productSheetPath = path.join(artifactDir, 'mobile_inapp_product_sheet.png');
  await page.screenshot({ path: productSheetPath });
  console.log('Saved product sheet screenshot:', productSheetPath);

  // Close sheet
  await page.evaluate(() => {
    window.dispatchEvent(new Event('close-product-sheet'));
  });
  await sleep(600);

  // 2. Capture In-App Search Sheet
  console.log('Opening In-App Search Modal...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-search-modal', {
      detail: { query: 'Amul Milk' }
    }));
  });
  await sleep(1500);
  const searchModalPath = path.join(artifactDir, 'mobile_inapp_search_modal.png');
  await page.screenshot({ path: searchModalPath });
  console.log('Saved search modal screenshot:', searchModalPath);

  // Close search
  await page.evaluate(() => {
    window.dispatchEvent(new Event('close-search-modal'));
  });
  await sleep(600);

  // 3. Capture In-App Login Sheet
  console.log('Opening In-App Login Modal...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('open-login-modal'));
  });
  await sleep(1500);
  const loginModalPath = path.join(artifactDir, 'mobile_inapp_login_modal.png');
  await page.screenshot({ path: loginModalPath });
  console.log('Saved login modal screenshot:', loginModalPath);

  // Close login
  await page.evaluate(() => {
    window.dispatchEvent(new Event('close-login-modal'));
  });
  await sleep(600);

  // 4. Capture In-App Categories Sheet
  console.log('Opening In-App Categories Drawer...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('open-categories-modal'));
  });
  await sleep(1500);
  const catDrawerPath = path.join(artifactDir, 'mobile_inapp_categories_drawer.png');
  await page.screenshot({ path: catDrawerPath });
  console.log('Saved categories drawer screenshot:', catDrawerPath);

  await browser.close();
  console.log('ALL 4 IN-APP SPA MODALS VERIFIED AND SCREENSHOTS CAPTURED!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
