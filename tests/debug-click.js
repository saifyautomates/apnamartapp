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

  const btnDetail = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button[aria-label='Add to cart']"));
    const visibleBtn = btns.find((b) => b.offsetParent !== null);
    if (!visibleBtn) return null;
    visibleBtn.click();
    return {
      clicked: true,
      textBefore: visibleBtn.innerText,
      containerHtml: visibleBtn.parentElement ? visibleBtn.parentElement.innerHTML : "",
    };
  });
  console.log("Btn detail before/during click:", btnDetail);

  await new Promise((r) => setTimeout(r, 1500));

  const afterState = await page.evaluate(() => {
    const stepperBtn = document.querySelector("button[aria-label='Decrease quantity']");
    const cartBtns = Array.from(document.querySelectorAll("button[aria-label='Open Cart']"));
    const visibleCart = cartBtns.find((b) => b.offsetParent !== null);
    return {
      stepperFound: Boolean(stepperBtn),
      stepperText: stepperBtn ? stepperBtn.innerText : null,
      visibleCartText: visibleCart ? visibleCart.innerText : null,
    };
  });

  console.log("After click:", afterState);
  await browser.close();
}

debug();
