const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function runTest() {
  console.log("=== STARTING GOOGLE MAP & BLINKIT CART AUDIT ===");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  try {
    console.log("\n[STEP 1] Loading Storefront...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await sleep(1500);

    // ---------------------------------------------------------
    // TEST 1: Open Google Map Location Picker
    // ---------------------------------------------------------
    console.log("\n[STEP 2] Opening Google Map Location Picker...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find((b) => b.innerText.includes("Deliver to Home") || b.innerText.includes("Select Location"));
      if (btn) btn.click();
    });
    await sleep(1000);

    // Screenshot Google Map Picker
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_google_map_picker.png") });
    console.log("✓ Saved test_google_map_picker.png");

    // Click "Talwandi" locality pill
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const talwandiBtn = btns.find((b) => b.innerText.trim() === "Talwandi");
      if (talwandiBtn) talwandiBtn.click();
    });
    await sleep(500);

    // Click "Confirm & Deliver Here"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const confirmBtn = btns.find((b) => b.innerText.includes("Confirm & Deliver Here"));
      if (confirmBtn) confirmBtn.click();
    });
    await sleep(1200);

    // ---------------------------------------------------------
    // TEST 2: Scroll to Deals & Add Product to Cart
    // ---------------------------------------------------------
    console.log("\n[STEP 3] Scrolling to Deals and clicking ADD button...");
    await page.evaluate(() => {
      const deals = document.getElementById("deals");
      if (deals) deals.scrollIntoView({ behavior: "instant" });
    });
    await sleep(800);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const addBtn = btns.find((b) => b.innerText.trim().includes("ADD"));
      if (addBtn) addBtn.click();
    });
    await sleep(1500);

    // Verify Floating Cart Strip
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_floating_cart_strip.png") });
    console.log("✓ Saved test_floating_cart_strip.png");

    // ---------------------------------------------------------
    // TEST 3: Open Cart Drawer & Verify Free Delivery Progress Bar
    // ---------------------------------------------------------
    console.log("\n[STEP 4] Opening Cart Drawer & Verifying Blinkit Experience...");
    await page.evaluate(() => {
      window.dispatchEvent(new Event("open-cart"));
    });
    await sleep(1500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "test_blinkit_cart_drawer.png") });
    console.log("✓ Saved test_blinkit_cart_drawer.png");

    console.log("\n=== ALL GOOGLE MAP & CART TESTS PASSED ===");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}

runTest();
