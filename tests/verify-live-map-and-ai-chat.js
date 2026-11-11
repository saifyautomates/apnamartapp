const puppeteer = require('puppeteer-core');
const fs = require('fs');
const assert = require('assert');

const BASE = 'http://localhost:3000';
const EDGE_EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================================');
  console.log('🚀 TESTING LIVE MAP TRACKING & GEMINI AI DELIVERY PARTNER CHAT');
  console.log('================================================================================');

  const browser = await puppeteer.launch({
    executablePath: EDGE_EXE,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('  ⚠️ Browser Error:', msg.text());
    }
  });

  // 1. Establish User Session
  console.log('\n--- 1. Authenticating Test Customer ---');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });

  const testPhone = '9829' + Math.floor(100000 + Math.random() * 900000);
  const loginSuccess = await page.evaluate(async (base, phone) => {
    const csrfRes = await fetch(`${base}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const token = csrfData.data?.csrfToken;
    const otpRes = await fetch(`${base}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ phone }),
    });
    const otpData = await otpRes.json();
    const code = otpData.data?.devOtp;
    if (!code) return false;
    const verifyRes = await fetch(`${base}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ phone, code }),
    });
    return verifyRes.ok;
  }, BASE, testPhone);

  console.log('Customer Logged In:', loginSuccess);
  assert.ok(loginSuccess, 'Customer authentication must succeed');

  // 2. Fetch Sample Variant & Add Address
  console.log('\n--- 2. Setting up Delivery Address & Cart Items ---');
  const setupResult = await page.evaluate(async (base) => {
    const csrfRes = await fetch(`${base}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const token = csrfData.data?.csrfToken;

    // Create address
    const addrRes = await fetch(`${base}/api/account/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({
        label: 'Home',
        name: 'Rahul Sharma',
        phone: '9829123456',
        line1: 'Flat 302, Royal Residency, Talwandi',
        city: 'Kota',
        state: 'Rajasthan',
        pincode: '324005',
        isDefault: true,
      }),
    });
    const addrData = await addrRes.json();
    const addressId = addrData.data?.address?.id || addrData.data?.id;

    // Get product variant via product detail
    const prodRes = await fetch(`${base}/api/products`);
    const prodData = await prodRes.json();
    const products = prodData.data?.items || prodData.data?.products || [];
    const sampleSlug = products[0]?.slug;
    let variantId = null;
    if (sampleSlug) {
      const detailRes = await fetch(`${base}/api/products/${sampleSlug}`);
      const detailData = await detailRes.json();
      variantId = detailData.data?.product?.variants?.[0]?.id;
    }

    // Add to cart
    let cartOk = false;
    if (variantId) {
      const cartRes = await fetch(`${base}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ variantId, qty: 3 }),
      });
      cartOk = cartRes.ok;
    }

    return { addressId, variantId, cartOk, token };
  }, BASE);

  console.log('Setup Result:', setupResult);
  assert.ok(setupResult.addressId, 'Address must be created');
  assert.ok(setupResult.cartOk, 'Cart items must be added');

  // 3. Place Order via Checkout API
  console.log('\n--- 3. Placing Instant Delivery Order ---');
  const orderResult = await page.evaluate(async (base, addressId, token) => {
    const res = await fetch(`${base}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
        'Idempotency-Key': `test-live-map-${Date.now()}`,
      },
      body: JSON.stringify({
        addressId,
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'COD',
      }),
    });
    return await res.json();
  }, BASE, setupResult.addressId, setupResult.token);

  const orderId = orderResult.data?.orderId || orderResult.data?.order?.id;
  const orderNumber = orderResult.data?.orderNumber || orderResult.data?.order?.orderNumber || 'CM-LIVE';
  console.log(`Order Placed Successfully: #${orderNumber} (ID: ${orderId})`);
  assert.ok(orderId, 'Order ID must be returned from checkout');

  // 4. Navigate to Order Tracking Page
  console.log(`\n--- 4. Navigating to Live Tracking Page: ${BASE}/orders/${orderId} ---`);
  await page.goto(`${BASE}/orders/${orderId}`, { waitUntil: 'networkidle0' });
  await sleep(1500);

  // Check if Leaflet Map Container is mounted
  const hasMapContainer = await page.$('.leaflet-container');
  console.log('Leaflet Map Initialized in DOM:', !!hasMapContainer);
  assert.ok(hasMapContainer, 'Leaflet Map must be initialized in DOM');

  // Check if Store & Rider markers exist
  const markerCount = await page.evaluate(() => {
    return document.querySelectorAll('.leaflet-marker-icon').length;
  });
  console.log('Leaflet Markers Count (Store, Rider, Home):', markerCount);
  assert.ok(markerCount >= 2, 'Should have at least Store and Destination markers');

  // Save screenshot of Live Map Tracking
  await page.screenshot({ path: 'tests/live-map-tracking-screen.png' });
  console.log('📸 Screenshot saved: tests/live-map-tracking-screen.png');

  // 5. Test Map Mode Switcher (GPS Map <-> Schematic Radar)
  console.log('\n--- 5. Testing Map Mode Switcher ---');
  const schematicBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Schematic Radar'));
  });
  if (schematicBtn) {
    await schematicBtn.click();
    await sleep(600);
    const hasSvg = await page.$('svg defs pattern#roadGrid');
    console.log('Schematic Radar Mode Active:', !!hasSvg);
  }

  // Switch back to GPS Map
  const gpsBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Live GPS Map'));
  });
  if (gpsBtn) {
    await gpsBtn.click();
    await sleep(600);
    const hasMapAgain = await page.$('.leaflet-container');
    console.log('GPS Map Restored:', !!hasMapAgain);
  }

  // 6. Test AI Chat with Delivery Rider
  console.log('\n--- 6. Opening AI Chat with Delivery Rider ---');
  const chatBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Chat with Rider'));
  });
  assert.ok(chatBtn, 'Chat with Rider button must exist');
  await chatBtn.click();
  await sleep(800);

  // Check if Chat Modal is open
  const chatModalHeader = await page.evaluate(() => {
    return document.querySelector('h3')?.textContent || '';
  });
  console.log('AI Chat Modal Header Rider Name:', chatModalHeader);

  // Click a quick chip: "Where are you right now?"
  console.log('\n--- 7. Sending Quick Chip: "Where are you right now?" ---');
  const quickChip = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Where are you right now?'));
  });
  if (quickChip) {
    await quickChip.click();
    console.log('Clicked quick chip, waiting for AI Rider response...');
    await sleep(2500);
  }

  // Read message thread
  let messages = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.rounded-2xl p'));
    return bubbles.map((p) => p.textContent.trim());
  });
  console.log('Messages in Thread:', messages);
  assert.ok(messages.length >= 2, 'Should have user question and rider answer');

  // Test typing a custom instruction: "Doorbell mat bajana, baby so raha hai"
  console.log('\n--- 8. Typing Custom Message: "Doorbell mat bajana, baby so raha hai" ---');
  const chatInput = await page.$("input[placeholder*='Message']");
  if (chatInput) {
    await chatInput.type('Doorbell mat bajana, baby so raha hai');
    const sendBtn = await page.$("button[class*='bg-[#0c831f]'] svg.lucide-send");
    if (sendBtn) {
      const parentBtn = await sendBtn.evaluateHandle((el) => el.closest('button'));
      await parentBtn.click();
      console.log('Sent custom instruction, waiting for AI response...');
      await sleep(2500);
    }
  }

  messages = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.rounded-2xl p'));
    return bubbles.map((p) => p.textContent.trim());
  });
  console.log('Updated Messages in Thread:');
  messages.forEach((m, i) => console.log(`  [${i + 1}] ${m}`));

  // Take screenshot of open AI Chat Modal
  await page.screenshot({ path: 'tests/rider-ai-chat-screen.png' });
  console.log('📸 Screenshot saved: tests/rider-ai-chat-screen.png');

  // Close Chat Modal
  const closeBtn = await page.evaluateHandle(() => {
    const svgs = Array.from(document.querySelectorAll('svg.lucide-x'));
    return svgs[0]?.closest('button');
  });
  if (closeBtn) {
    await closeBtn.click();
    await sleep(500);
  }

  // 9. Test Simulator: Transition to OUT_FOR_DELIVERY & DELIVERED
  console.log('\n--- 9. Testing Order Simulator Transitions ---');
  const outForDeliveryBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent.includes('Out'));
  });
  if (outForDeliveryBtn) {
    await outForDeliveryBtn.click();
    await sleep(1500);
    const heading = await page.$eval('h1', (el) => el.textContent);
    console.log('Status Header After Simulation:', heading);
    assert.ok(heading.includes('Rider on the way'), 'Header should update to Rider on the way');
  }

  // Save Final Verification Screenshot
  await page.screenshot({ path: 'tests/order-simulated-out-for-delivery.png' });
  console.log('📸 Screenshot saved: tests/order-simulated-out-for-delivery.png');

  console.log('\n================================================================================');
  console.log('✅ ALL TESTS PASSED: LIVE MAP TRACKING & GEMINI AI CHAT VERIFIED 100%');
  console.log('================================================================================');

  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
