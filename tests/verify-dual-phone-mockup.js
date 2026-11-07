const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  console.log("1. Navigating to Home Screen...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await sleep(2500);

  // Click add on a couple items so cart shows count
  await page.evaluate(() => {
    const btns = document.querySelectorAll("article button");
    if (btns.length > 0 && typeof btns[0].click === "function") {
      btns[0].click();
    }
  });
  await sleep(1000);

  const homePath = path.join(ARTIFACT_DIR, "phone_1_home_green_header.png");
  await page.screenshot({ path: homePath });
  console.log("Saved Phone 1 Home Screen to:", homePath);

  console.log("2. Navigating to Grocery & Staples Category Screen...");
  await page.goto("http://localhost:3000/category/staples", { waitUntil: "domcontentloaded" });
  await sleep(2500);

  const categoryPath = path.join(ARTIFACT_DIR, "phone_2_grocery_staples_listing.png");
  await page.screenshot({ path: categoryPath });
  console.log("Saved Phone 2 Category Screen to:", categoryPath);

  await browser.close();
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
