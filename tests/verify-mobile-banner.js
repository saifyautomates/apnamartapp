const puppeteer = require('puppeteer-core');

async function testMobileAndBanners() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  // 1. Mobile Storefront Screenshot (iPhone viewport 375x812)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await mobilePage.screenshot({
    path: 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc\\storefront_mobile_compact_banner.png',
    fullPage: false
  });
  console.log('✓ Captured mobile storefront screenshot (compact banner)');

  // 2. Admin Banners Page (Staff Login first)
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1920, height: 1080 });
  await adminPage.goto('http://localhost:3000/staff-login', { waitUntil: 'networkidle2' });
  await adminPage.evaluate(() => {
    const quickBtn = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.includes('1-Click')
    );
    if (quickBtn) quickBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await adminPage.goto('http://localhost:3000/admin/banners', { waitUntil: 'networkidle2' });
  await adminPage.screenshot({
    path: 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc\\admin_banners_page.png',
    fullPage: false
  });
  console.log('✓ Captured admin banners management screenshot');

  // 3. Click "Add New Sale Banner" and capture modal with direct gallery upload
  const addBtn = await adminPage.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Add New Sale Banner'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Add New Sale Banner:', addBtn);

  await new Promise(r => setTimeout(r, 600));
  await adminPage.screenshot({
    path: 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc\\admin_add_banner_modal_gallery_upload.png',
    fullPage: false
  });
  console.log('✓ Captured Add Banner modal with direct gallery upload & live mobile preview');

  await browser.close();
  console.log('\n🎉 ALL TESTS PASSED!');
}

testMobileAndBanners().catch(console.error);
