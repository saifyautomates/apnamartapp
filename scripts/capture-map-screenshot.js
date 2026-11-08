const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

    // Open location modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("header button"));
      const target = btns.find((b) => b.innerText.includes("Deliver to") || b.innerText.includes("Select Location") || b.querySelector(".lucide-map-pin"));
      if (target) target.click();
    });

    await delay(1500);

    // Click Talwandi chip
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const talwandi = btns.find((b) => b.innerText.includes("Talwandi"));
      if (talwandi) talwandi.click();
    });

    await delay(2000);

    // Capture screenshot
    await page.screenshot({
      path: "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\0ce637a4-3b8b-44de-8e7f-c64be7e15c2d\\map_live_verification.png",
    });
    console.log("Captured live map screenshot successfully");
  } finally {
    await browser.close();
  }
}

capture().catch(console.error);

