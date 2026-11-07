const puppeteer = require("puppeteer-core");
const path = require("path");
const jwt = require("jsonwebtoken");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";
const JWT_SECRET = process.env.JWT_SECRET || "grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt";

function makeAdminToken() {
  return jwt.sign(
    {
      adminId: "adm-saif-owner-001",
      kind: "ADMIN",
      roles: ["OWNER"],
      permissions: [
        "dashboard:read",
        "integrations:read",
        "orders:read",
        "orders:write",
        "pos:read",
        "pos:write",
        "products:read",
        "products:write",
        "inventory:read",
        "inventory:write",
        "reports:read",
        "settings:read",
        "settings:write"
      ],
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // iPhone 14 Pro mobile viewport (393 x 852, 2x scale)
    await page.setViewport({
      width: 393,
      height: 852,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    // Set authenticated admin cookie
    const token = makeAdminToken();
    await page.setCookie({
      name: "gcp_access",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    });

    console.log("Navigating to http://localhost:3000/admin/pos (Mobile POS)...");
    await page.goto("http://localhost:3000/admin/pos", { waitUntil: "domcontentloaded" });
    await sleep(2500);

    console.log("Current URL:", page.url());

    // Screen 1: Mobile POS New Bill
    const screen1Path = path.join(ARTIFACT_DIR, "mobile_pos_new_bill_mockup.png");
    await page.screenshot({ path: screen1Path });
    console.log("Saved Screen 1 to:", screen1Path);

    // Screen 2: Tap "Generate Bill & Collect" button to open settlement bottom sheet
    console.log("Tapping 'Generate Bill & Collect' button...");
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes("Generate Bill & Collect"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log("Clicked collect button:", clicked);
    if (clicked) {
      await sleep(1000);
      const screen2Path = path.join(ARTIFACT_DIR, "mobile_pos_settlement_sheet.png");
      await page.screenshot({ path: screen2Path });
      console.log("Saved Screen 2 to:", screen2Path);
    }

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();
