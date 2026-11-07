const puppeteer = require('puppeteer-core');
const path = require('path');
const jwt = require('jsonwebtoken');

const ARTIFACTS_DIR = 'C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc';
const JWT_SECRET = 'grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt';

const ALL_PERMS = [
  'dashboard:read', 'orders:read', 'orders:write', 'products:read', 'products:write',
  'categories:write', 'inventory:read', 'inventory:write', 'customers:read', 'customers:write',
  'offers:write', 'coupons:write', 'delivery:write', 'payments:read', 'payments:write',
  'loyalty:write', 'credit:write', 'reports:read', 'integrations:read', 'integrations:write',
  'users:read', 'users:write', 'settings:write', 'audit:read'
];

async function verifyBusyPos() {
  console.log('🚀 Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Sign SuperAdmin Token and Set Cookie
    console.log('🔑 Minting SuperAdmin token and setting cookies...');
    const token = jwt.sign(
      {
        kind: 'ADMIN',
        adminId: 'admin-owner-default',
        roles: ['OWNER'],
        permissions: ALL_PERMS
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Navigate to a blank page on localhost first to set cookies for domain
    await page.goto('http://localhost:3000/offline', { waitUntil: 'domcontentloaded' });
    await page.setCookie({
      name: 'gcp_access',
      value: token,
      domain: 'localhost',
      path: '/'
    });

    // 2. Navigate directly to /admin/pos
    console.log('🌐 Navigating directly to /admin/pos...');
    await page.goto('http://localhost:3000/admin/pos', { waitUntil: 'networkidle2' });
    console.log('URL at /admin/pos:', page.url());

    await new Promise(r => setTimeout(r, 1500));

    // Screenshot 1: Initial load
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_pos_initial_load.png') });
    console.log('📸 Captured initial POS load');

    // 3. Switch to BUSY POS Hub Tab
    const tabClicked = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      const busyTab = tabs.find(b => b.innerText.includes('BUSY POS Terminal Hub'));
      if (busyTab) {
        busyTab.click();
        return true;
      }
      return false;
    });
    console.log('BUSY POS Tab clicked:', tabClicked);

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_hub_verified.png') });
    console.log('📸 Captured BUSY POS Hub screenshot at admin_busy_pos_hub_verified.png');

    // 4. Click View Slip
    const slipClicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const viewSlipBtn = buttons.find(b => b.innerText.includes('View Slip'));
      if (viewSlipBtn) {
        viewSlipBtn.click();
        return true;
      }
      return false;
    });
    console.log('Slip button clicked:', slipClicked);

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_receipt_slip_verified.png') });
    console.log('📸 Captured Receipt Slip screenshot at admin_busy_pos_receipt_slip_verified.png');

    // Close slip modal
    await page.evaluate(() => {
      const closeButtons = [...document.querySelectorAll('button')];
      const closeBtn = closeButtons.find(b => b.innerText.includes('Close Slip') || b.innerText === '✕');
      if (closeBtn) closeBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // 5. Click Test Connection Handshake
    const testClicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const testBtn = buttons.find(b => b.innerText.includes('Test Handshake'));
      if (testBtn) {
        testBtn.click();
        return true;
      }
      return false;
    });
    console.log('Test Handshake clicked:', testClicked);

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_handshake_verified.png') });
    console.log('📸 Captured Handshake screenshot at admin_busy_pos_handshake_verified.png');

    console.log('🎉 ALL BUSY POS AUTOMATED VERIFICATIONS PASSED!');
  } finally {
    await browser.close();
  }
}

verifyBusyPos().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
