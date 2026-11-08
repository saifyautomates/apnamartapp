const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function run() {
  console.log("Launching Chrome to capture desktop storefront deals & popular products...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  // Match desktop browser viewport
  await page.setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await sleep(1500);

  // Scroll to deals section
  await page.evaluate(() => {
    const el = document.getElementById("deals");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await sleep(1000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "desktop_deals_verified.png"),
    fullPage: false,
  });
  console.log("Saved desktop_deals_verified.png");

  // Capture full page as well
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "desktop_full_verified.png"),
    fullPage: true,
  });
  console.log("Saved desktop_full_verified.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

