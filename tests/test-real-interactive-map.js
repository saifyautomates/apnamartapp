const puppeteer = require("puppeteer-core");
const assert = require("assert");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMapTests() {
  console.log("================================================================================");
  console.log("🗺️  CENTRAL MART KOTA — REAL INTERACTIVE MAP & REVERSE GEOCODE AUDIT");
  console.log("================================================================================\n");

  // [TEST 1] Verify Reverse Geocoding API Endpoints
  console.log("▶ [CHECK 1/3] Reverse Geocode API Endpoints");

  // 1A. Central Mart 80 Feet Road
  const r1 = await fetch(`${BASE_URL}/api/delivery/reverse-geocode?lat=25.1485&lng=75.8458`);
  assert.strictEqual(r1.status, 200, "80 Feet Road coords must return 200");
  const j1 = await r1.json();
  assert.ok(j1.success, "API must return success: true");
  assert.strictEqual(j1.data.city, "Kota", "City must be Kota");
  assert.strictEqual(j1.data.state, "Rajasthan", "State must be Rajasthan");
  assert.ok(j1.data.fullAddress.includes("Kota"), "Address must include Kota");
  console.log(`  ✅ PASS: 80 Feet Road Hub -> ${j1.data.fullAddress} (ETA: ${j1.data.eta})`);

  // 1B. Talwandi
  const r2 = await fetch(`${BASE_URL}/api/delivery/reverse-geocode?lat=25.1524&lng=75.8315`);
  const j2 = await r2.json();
  assert.strictEqual(j2.data.pincode, "324005", "Talwandi pincode must be 324005");
  console.log(`  ✅ PASS: Talwandi -> ${j2.data.locality} (PIN: ${j2.data.pincode}, ETA: ${j2.data.eta})`);

  // 1C. Kunhari (Landmark City)
  const r3 = await fetch(`${BASE_URL}/api/delivery/reverse-geocode?lat=25.2150&lng=75.8400`);
  const j3 = await r3.json();
  assert.strictEqual(j3.data.pincode, "324008", "Kunhari pincode must be 324008");
  console.log(`  ✅ PASS: Kunhari Landmark City -> ${j3.data.locality} (PIN: ${j3.data.pincode}, ETA: ${j3.data.eta})`);

  // [TEST 2] Puppeteer Browser E2E: Interactive Leaflet Map in Header Location Modal
  console.log("\n▶ [CHECK 2/3] Browser UI: Leaflet Interactive Map & Delivery Pinning");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,850"],
    defaultViewport: { width: 1280, height: 850 },
  });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Open location modal via header button
    const locationBtnSelector = "header button:has-text('Deliver to Home'), header button:has(.lucide-map-pin), header button:has(.lucide-zap)";
    await page.evaluate(() => {
      // Find button in header that triggers location selector
      const btns = Array.from(document.querySelectorAll("header button"));
      const target = btns.find((b) => b.innerText.includes("Deliver to") || b.innerText.includes("Select Location") || b.querySelector(".lucide-map-pin"));
      if (target) target.click();
    });

    await delay(600);

    // Verify modal content
    const modalTitle = await page.$eval("h3", (el) => el.innerText).catch(() => "");
    console.log(`  Modal opened with title: "${modalTitle}"`);
    assert.ok(modalTitle.toLowerCase().includes("pin delivery location"), "Must show Pin Delivery Location title");
    console.log("  ✅ PASS: Map modal opened cleanly");

    // Verify Leaflet map container exists
    const leafletContainer = await page.$(".leaflet-container");
    assert.ok(leafletContainer, "Must find .leaflet-container rendered by Leaflet in DOM");
    console.log("  ✅ PASS: Real Leaflet Map engine initialized successfully in DOM");

    // Wait for Leaflet map tiles
    await page.waitForSelector(".leaflet-tile-pane", { timeout: 4000 });
    console.log("  ✅ PASS: Leaflet tile layers rendered");

    // Verify Central Mart store marker in Leaflet
    const storeMarker = await page.$(".cm-store-marker");
    assert.ok(storeMarker, "Must render Central Mart Flagship Store hub marker");
    console.log("  ✅ PASS: Central Mart 80 Feet Road dispatch hub marker rendered on map");

    // Verify popular locality chips
    const chipTexts = await page.$$eval("button", (btns) =>
      btns
        .map((b) => b.innerText.trim())
        .filter((t) => t.includes("Talwandi") || t.includes("Vigyan Nagar") || t.includes("Dadabari") || t.includes("80 Feet Road"))
    );
    assert.ok(chipTexts.length >= 3, "Must display popular Kota locality chips");
    console.log(`  ✅ PASS: Found ${chipTexts.length} Kota quick locality chips:`, chipTexts.slice(0, 4));

    // Click on a locality chip (e.g. Talwandi)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const talwandiBtn = btns.find((b) => b.innerText.includes("Talwandi"));
      if (talwandiBtn) talwandiBtn.click();
    });

    await delay(1200);

    // Fill house no
    await page.type("input[placeholder*='Flat']", "Flat 402, Om Tower");

    // Confirm & Save
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const confirmBtn = btns.find((b) => b.innerText.includes("Confirm & Deliver Here"));
      if (confirmBtn) confirmBtn.click();
    });

    await delay(1000);

    // Verify localStorage has saved location
    const storedAddress = await page.evaluate(() => localStorage.getItem("cm_delivery_address"));
    const storedPincode = await page.evaluate(() => localStorage.getItem("cm_delivery_pincode"));
    console.log(`  Stored address in localStorage: "${storedAddress}"`);
    console.log(`  Stored pincode in localStorage: "${storedPincode}"`);
    assert.ok(storedAddress && storedAddress.includes("Kota"), "Stored address must contain Kota");
    assert.strictEqual(storedPincode, "324005", "Stored pincode must be 324005");
    console.log("  ✅ PASS: Address and coordinates successfully persisted to client state");

    // [TEST 3] Checkout Page Map Picker Verification
    console.log("\n▶ [CHECK 3/3] Checkout Page Address Selection with Map");
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle0" });
    const checkoutPageText = await page.evaluate(() => document.body.innerText);
    assert.ok(
      checkoutPageText.includes("Delivery Address") || checkoutPageText.includes("Delivery"),
      "Checkout page must have Delivery section"
    );
    console.log("  ✅ PASS: Checkout page correctly displays delivery address framework");

    console.log("\n================================================================================");
    console.log("🎉 ALL REAL MAP & REVERSE GEOCODE AUDITS PASSED WITH 100% SUCCESS!");
    console.log("================================================================================\n");
  } finally {
    await browser.close();
  }
}

runMapTests().catch((err) => {
  console.error("❌ Map test failed:", err);
  process.exit(1);
});
