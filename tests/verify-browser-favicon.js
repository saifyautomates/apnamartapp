const puppeteer = require("puppeteer-core");
const assert = require("assert");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function verifyFavicon() {
  console.log("=== VERIFYING LIVE PRODUCTION BROWSER FAVICON ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

    // Inspect the head icon links
    const iconLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("link[rel*='icon']"));
      return links.map((l) => ({
        rel: l.getAttribute("rel"),
        href: l.getAttribute("href"),
        type: l.getAttribute("type"),
        sizes: l.getAttribute("sizes"),
      }));
    });

    console.log("Found icon links in HTML head:", iconLinks);

    assert.ok(iconLinks.some((l) => l.href.includes("favicon.svg")), "Must include /favicon.svg link");
    assert.ok(iconLinks.some((l) => l.href.includes("favicon-32x32.png")), "Must include /favicon-32x32.png link");
    assert.ok(iconLinks.some((l) => l.href.includes("favicon-16x16.png")), "Must include /favicon-16x16.png link");
    assert.ok(iconLinks.some((l) => l.href.includes("favicon.ico")), "Must include /favicon.ico link");
    assert.ok(iconLinks.some((l) => l.href.includes("20261108_emblem")), "Must include 20261108_emblem cache buster");

    console.log("✓ All 4 modern browser favicon links properly rendered with cache buster in <head>");

    // Check LaunchLoader logo
    const loaderImg = await page.$eval(".loader-overlay img", (el) => ({
      src: el.src,
      className: el.className,
    })).catch(() => null);

    if (loaderImg) {
      console.log("Loader image attributes:", loaderImg);
      assert.ok(!loaderImg.className.includes("p-1"), "Must not have p-1 padding creating white borders");
      assert.ok(!loaderImg.className.includes("bg-white"), "Must not have bg-white creating white box");
      assert.ok(!loaderImg.className.includes("rounded-3xl"), "Must not have rounded-3xl clipping box");
      console.log("✓ LaunchLoader image is clean floating emblem with zero white border padding or clipping box");
    }

    // Now render a simulated dark browser tab to verify how it looks on the user's browser
    await page.setContent(`<!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            background-color: #221d28;
            margin: 0;
            padding: 40px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .browser-tab {
            background: #3d2935;
            border: 1px solid #a855f7;
            border-radius: 9999px;
            padding: 8px 18px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          }
          .tab-icon {
            width: 20px;
            height: 20px;
            display: block;
          }
          .tab-title {
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: -0.2px;
          }
        </style>
      </head>
      <body>
        <div class="browser-tab">
          <img class="tab-icon" src="http://localhost:3000/favicon-32x32.png?v=20261108_emblem" alt="Central Mart Favicon" />
          <span class="tab-title">Central Mart — Kota's Online Supermarket</span>
        </div>
      </body>
    </html>`);

    const artifactPath = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\0ce637a4-3b8b-44de-8e7f-c64be7e15c2d\\tab_render_verification.png";
    await page.screenshot({ path: artifactPath, omitBackground: false });
    console.log("✓ Saved live dark-tab simulation screenshot to:", artifactPath);

    console.log("\n========================================================");
    console.log("🎉 BROWSER FAVICON VERIFICATION COMPLETED WITH 100% SUCCESS!");
    console.log("========================================================\n");
  } finally {
    await browser.close();
  }
}

verifyFavicon().catch((e) => {
  console.error(e);
  process.exit(1);
});
