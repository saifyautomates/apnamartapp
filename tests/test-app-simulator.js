const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = path.resolve("C:/Users/jackx/.gemini/antigravity/brain/0ce637a4-3b8b-44de-8e7f-c64be7e15c2d");

async function run() {
  console.log("Launching Puppeteer with Chrome for iPhone 13 Simulator verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 960 },
  });

  try {
    const page = await browser.newPage();
    console.log("Navigating to http://localhost:3000/app ...");
    await page.goto("http://localhost:3000/app", { waitUntil: "networkidle2" });
    await sleep(2500);

    // 1. Capture overall iPhone 13 Simulator view
    const screen1Path = path.join(ARTIFACT_DIR, "simulator_01_iphone13_home.png");
    await page.screenshot({ path: screen1Path, fullPage: false });
    console.log("Saved screenshot 1 to:", screen1Path);

    // 2. Click "+ Lay's Classic" quick test cart injection button on the side panel
    console.log("Testing Quick Add to Cart from Simulator Remote...");
    const addLaysBtn = await page.waitForSelector("button::-p-text('+ Lay\\'s Classic')");
    if (addLaysBtn) {
      await addLaysBtn.click();
      await sleep(2000);
    }

    // 3. Click "Tap Bottom Cart Bar (Expand Sheet)" button to verify the sliding sheet
    console.log("Testing Tap Bottom Cart Bar (Expand Sheet)...");
    const openSheetBtn = await page.waitForSelector("button::-p-text('Tap Bottom Cart Bar')");
    if (openSheetBtn) {
      await openSheetBtn.click();
      await sleep(2000);
    }

    const screen2Path = path.join(ARTIFACT_DIR, "simulator_02_cart_sheet_open.png");
    await page.screenshot({ path: screen2Path, fullPage: false });
    console.log("Saved screenshot 2 to:", screen2Path);

    // 4. Test Presets: Click "Lay's PDP"
    console.log("Testing Lay's PDP preset...");
    const pdpBtn = await page.waitForSelector("div::-p-text('Lay\\'s PDP')");
    if (pdpBtn) {
      await pdpBtn.click();
      await sleep(2000);
    }

    const screen3Path = path.join(ARTIFACT_DIR, "simulator_03_pdp_screen.png");
    await page.screenshot({ path: screen3Path, fullPage: false });
    console.log("Saved screenshot 3 to:", screen3Path);

    // 5. Test QR Modal
    console.log("Testing Scan on Real Phone QR Code modal...");
    const qrBtn = await page.waitForSelector("button::-p-text('Scan on Real Phone')");
    if (qrBtn) {
      await qrBtn.click();
      await sleep(1000);
    }

    const screen4Path = path.join(ARTIFACT_DIR, "simulator_04_qr_modal.png");
    await page.screenshot({ path: screen4Path, fullPage: false });
    console.log("Saved screenshot 4 to:", screen4Path);

    console.log("All iPhone 13 Simulator tests completed successfully!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();
