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
  page.on("response", async (res) => {
    if (res.url().includes("/api/cart")) {
      try {
        const text = await res.text();
        console.log("CART RES", res.request().method(), res.status(), text);
      } catch (e) {}
    }
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

  await page.evaluate(() => {
    const btn = document.querySelector("button[aria-label='Add to cart']");
    if (btn) btn.click();
  });

  await new Promise((r) => setTimeout(r, 1500));

  await browser.close();
}

debug();
