const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function run() {
  console.log("Launching Chrome to verify Checkout Experience...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  // 1. Visit checkout page
  console.log("[STEP 1] Navigating to /checkout...");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle0" });
  await sleep(1500);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "test_checkout_view.png"),
    fullPage: false,
  });
  console.log("Saved test_checkout_view.png");

  // 2. Click "Pin on Google Map" button if visible
  console.log("[STEP 2] Clicking Pin on Google Map button...");
  const mapBtn = await page.$("button::-p-text(Pin on Google Map)");
  if (mapBtn) {
    await mapBtn.click();
    await sleep(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "test_checkout_map_opened.png"),
      fullPage: false,
    });
    console.log("Saved test_checkout_map_opened.png");
  }

  await browser.close();
  console.log("Checkout tests complete!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
