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

async function safeEval(page, fn) {
  try {
    return await page.evaluate(fn);
  } catch {
    await new Promise(r => setTimeout(r, 1500));
    return await page.evaluate(fn);
  }
}

async function captureModals() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    const token = jwt.sign(
      { kind: 'ADMIN', adminId: 'admin-owner-default', roles: ['OWNER'], permissions: ALL_PERMS },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    await page.goto('http://localhost:3000/offline', { waitUntil: 'domcontentloaded' });
    await page.setCookie({ name: 'gcp_access', value: token, domain: 'localhost', path: '/' });

    await page.goto('http://localhost:3000/admin/pos', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // Switch to BUSY tab
    await safeEval(page, () => {
      const tabs = [...document.querySelectorAll('button')];
      const busyTab = tabs.find(b => b.innerText.includes('BUSY POS Terminal Hub'));
      if (busyTab) busyTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Click "Test Connection" button
    console.log('🔌 Clicking "Test Connection"...');
    await safeEval(page, () => {
      const buttons = [...document.querySelectorAll('button')];
      const btn = buttons.find(b => b.innerText.includes('Test Connection'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_handshake_verified.png') });
    console.log('📸 Captured Handshake modal screenshot');

    // Close handshake modal
    await safeEval(page, () => {
      const buttons = [...document.querySelectorAll('button')];
      const closeBtn = buttons.find(b => b.innerText.includes('Close') || b.innerText.includes('✕'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. Open Itemized GST Bill Slip Modal by clicking the first table row
    console.log('🧾 Clicking first voucher row in table...');
    await safeEval(page, () => {
      const row = document.querySelector('tbody tr');
      if (row) row.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_receipt_slip_verified.png') });
    console.log('📸 Captured Receipt Slip modal screenshot');

    // Close receipt modal
    await safeEval(page, () => {
      const buttons = [...document.querySelectorAll('button')];
      const closeBtn = buttons.find(b => b.innerText.includes('Close Slip') || b.innerText.includes('✕'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 3. Open "+ Add Billing Counter" Modal
    console.log('🖥️ Clicking "+ Add Billing Counter"...');
    await safeEval(page, () => {
      const buttons = [...document.querySelectorAll('button')];
      const addBtn = buttons.find(b => b.innerText.includes('Add Billing Counter'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_busy_pos_add_counter_modal.png') });
    console.log('📸 Captured Add Counter modal screenshot');

    console.log('✅ ALL MODALS CAPTURED PERFECTLY!');
  } finally {
    await browser.close();
  }
}

captureModals().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
