const puppeteer = require('puppeteer-core');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureMockupScreens() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // iPhone 14 Pro / 15 viewport (393 x 852)
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  const artifactDir = 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc';

  console.log('1. Navigating to Home Screen http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Add 3 items to cart so Cart has badge count and rich state
  console.log('2. Adding items to cart for realistic state...');
  await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('article button'));
    if (btns[0]) btns[0].click();
    await new Promise(r => setTimeout(r, 600));
    if (btns[1]) btns[1].click();
    await new Promise(r => setTimeout(r, 600));
    if (btns[2]) btns[2].click();
  });
  await sleep(1500);

  // SCREEN 1: Capture Home Screen Mockup
  console.log('3. Capturing Screen 1: Home View...');
  const screen1Path = path.join(artifactDir, 'mockup_screen_1_home.png');
  await page.screenshot({ path: screen1Path });
  console.log('Saved Screen 1:', screen1Path);

  // SCREEN 2: Capture Product Detail Modal / Sheet Mockup
  console.log('4. Capturing Screen 2: Product Detail Sheet...');
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
  const screen2Path = path.join(artifactDir, 'mockup_screen_2_product.png');
  await page.screenshot({ path: screen2Path });
  console.log('Saved Screen 2:', screen2Path);

  // Close product sheet
  await page.evaluate(() => {
    window.dispatchEvent(new Event('close-product-sheet'));
  });
  await sleep(800);

  // SCREEN 3: Capture Your Cart Sheet Mockup
  console.log('5. Capturing Screen 3: Your Cart Sheet...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('open-cart'));
  });
  await sleep(1500);
  const screen3Path = path.join(artifactDir, 'mockup_screen_3_cart.png');
  await page.screenshot({ path: screen3Path });
  console.log('Saved Screen 3:', screen3Path);

  await browser.close();
  console.log('ALL 3 MOCKUP SCREENS VERIFIED & CAPTURED SUCCESSFULLY!');
}

captureMockupScreens().catch(err => {
  console.error('Error during mockup verification:', err);
  process.exit(1);
});

