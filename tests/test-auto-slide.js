const puppeteer = require("puppeteer-core");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";

async function run() {
  console.log("Launching Chrome to verify Auto-Sliding Desktop Carousels...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850, deviceScaleFactor: 1 });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await sleep(1000);

  // Scroll to deals section so it is in viewport
  await page.evaluate(() => {
    const deals = document.getElementById("deals");
    if (deals) deals.scrollIntoView({ behavior: "instant", block: "center" });
  });

  // Get initial scrollLeft of deals track
  const initialScroll = await page.evaluate(() => {
    const dealsTrack = document.querySelector("#deals .overflow-x-auto");
    return dealsTrack ? dealsTrack.scrollLeft : 0;
  });
  console.log("Initial Deals scrollLeft at t=0s:", initialScroll);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "test_sliding_initial.png"),
  });
  console.log("Saved test_sliding_initial.png");

  // Wait 4.5 seconds for auto-slide cycle to execute
  console.log("Waiting 4.5s for desktop auto-slide glide...");
  await sleep(4500);

  const afterScroll = await page.evaluate(() => {
    const dealsTrack = document.querySelector("#deals .overflow-x-auto");
    return dealsTrack ? dealsTrack.scrollLeft : 0;
  });
  console.log("Deals scrollLeft at t=4.5s after auto-glide:", afterScroll);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "test_sliding_after_glide.png"),
  });
  console.log("Saved test_sliding_after_glide.png");

  await browser.close();
  console.log("Verification finished!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

