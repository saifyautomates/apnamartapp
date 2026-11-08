const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

async function debug() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

  const btnInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("button[aria-label='Add to cart']"));
    return all.map((b, i) => {
      const rect = b.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && b.offsetParent !== null;
      return { index: i, isVisible, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
    }).filter(b => b.isVisible).slice(0, 5);
  });

  console.log("Visible Add buttons:", btnInfo);
  await browser.close();
}

debug();
