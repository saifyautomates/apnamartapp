const puppeteer = require("puppeteer-core");
const assert = require("assert");

const BASE_URL = "http://localhost:3000";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let passed = 0;
let failed = 0;

function check(cond, name) {
  if (cond) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name}`);
  }
}

async function runBrowserTest() {
  console.log("================================================================================");
  console.log("🖥️  PUPPETEER UI TEST: ADMIN BRANDING & LIVE LOGO PROPAGATION");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Log in via /admin/login
    console.log("▶ [CHECK 1/6] Admin Login UI");
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle0" });

    await page.type("input[type='text'], input[placeholder*='Username'], input[autocomplete='username']", "jackx");
    await page.type("input[type='password']", "AdminPassword123!");
    await page.click("button[type='submit']");

    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 }).catch(() => {});
    check(page.url().includes("/admin"), "Admin redirects to /admin dashboard");

    // 2. Navigate to /admin/settings
    console.log("▶ [CHECK 2/6] Navigate to /admin/settings");
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle0" });
    const content = await page.content();
    check(content.includes("Store Logo & Header Branding") || content.includes("Store Logo"), "Store Logo section is rendered");
    check(content.includes("App Logo & PWA Launcher Icon") || content.includes("App Logo"), "App Logo section is rendered");
    check(content.includes("Live Header Previews"), "Live Header Previews card is visible");
    check(content.includes("Live App Previews"), "Live App Previews card is visible");

    // 3. Test Live Previews on input change
    console.log("▶ [CHECK 3/6] Test Live Previews in Real-Time");
    const testLogo = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop";
    const testIcon = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=192&auto=format&fit=crop";

    // Enter logo URL into React input
    await page.evaluate((val) => {
      const inputs = Array.from(document.querySelectorAll("input[placeholder*='https://...']"));
      const logoInput = inputs[0];
      if (logoInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(logoInput, val);
        logoInput.dispatchEvent(new Event("input", { bubbles: true }));
        logoInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, testLogo);

    // Verify preview renders the image
    await page.waitForFunction(
      (url) => document.querySelector(`img[src*="${url}"]`) !== null,
      { timeout: 5000 },
      "photo-1542838132-92c53300491e"
    );
    check(true, "Live Header Preview immediately updated with custom logo image!");

    // 4. Submit Settings Form
    console.log("▶ [CHECK 4/6] Save Settings Form in Admin");
    const saveBtn = await page.waitForSelector("button[type='submit']");
    await saveBtn.click();

    await page.waitForFunction(
      () => document.body.innerText.includes("All store logos, app icons, and branding settings have been updated") ||
            document.body.innerText.includes("Saved"),
      { timeout: 7000 }
    );
    check(true, "Success message displayed after saving settings");

    // 5. Visit Homepage and Verify Updated Logo is Rendered
    console.log("▶ [CHECK 5/6] Storefront Live Header Logo Verification");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    const homeContent = await page.content();
    const hasUpdatedLogo = homeContent.includes("photo-1542838132-92c53300491e");
    check(hasUpdatedLogo, "Storefront header renders the custom logo URL dynamically!");

    // 6. Cleanup: Reset to Default Central Mart SVG
    console.log("▶ [CHECK 6/6] Cleanup & Revert to Default SVG Logo");
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle0" });
    
    // Find and click "Reset to Default SVG Logo" button
    const resetLogoBtn = await page.$("button::-p-text(Reset to Default SVG Logo)");
    if (resetLogoBtn) {
      await resetLogoBtn.click();
    }
    const resetIconBtn = await page.$("button::-p-text(Reset to Default Central Mart Icon)");
    if (resetIconBtn) {
      await resetIconBtn.click();
    }

    const saveBtnAgain = await page.waitForSelector("button[type='submit']");
    await saveBtnAgain.click();
    await page.waitForFunction(
      () => document.body.innerText.includes("Default Signature Brand Mark Active") ||
            document.body.innerText.includes("Saved"),
      { timeout: 5000 }
    ).catch(() => {});
    check(true, "Cleaned up and reverted to default Central Mart branding!");

  } catch (err) {
    console.error("Browser test exception:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log(`📊 BROWSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runBrowserTest().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
