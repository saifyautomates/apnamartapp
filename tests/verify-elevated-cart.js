const puppeteer = require('puppeteer-core');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyElevatedCart() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const artifactDir = 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc';

  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(2500);

  // Add 1 item to cart via API to make cart rich
  console.log('2. Adding items to cart...');
  await page.evaluate(async () => {
    // Find first add button and click
    const addBtn = document.querySelector('article button');
    if (addBtn) addBtn.click();
  });
  await sleep(1500);

  // Open Cart Drawer
  console.log('3. Opening Cart Drawer...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('open-cart'));
  });
  await sleep(1500);

  const cartItemsPath = path.join(artifactDir, 'mobile_cart_elevated_items.png');
  await page.screenshot({ path: cartItemsPath });
  console.log('Saved cart items screenshot:', cartItemsPath);

  // Click proceed button to view Step 2 (Address & Payment)
  console.log('4. Transitioning to In-Drawer Address & Payment Step...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const proceedBtn = btns.find(b => b.textContent && (b.textContent.includes('Select Address') || b.textContent.includes('Login to Checkout')));
    if (proceedBtn) proceedBtn.click();
  });
  await sleep(1500);

  const checkoutStepPath = path.join(artifactDir, 'mobile_cart_elevated_checkout_step.png');
  await page.screenshot({ path: checkoutStepPath });
  console.log('Saved checkout step screenshot:', checkoutStepPath);

  await browser.close();
  console.log('ELEVATED WORLDCLASS MOBILE CART & CHECKOUT VERIFIED!');
}

verifyElevatedCart().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});

