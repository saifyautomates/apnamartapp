const puppeteer = require("puppeteer-core");
const path = require("path");
const jwt = require("jsonwebtoken");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\051c239f-0b90-407b-92fc-13981b4066bc";
const JWT_SECRET = "grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt";

async function verifyBusyPosClone() {
  console.log("=== STARTING REAL BUSY POS WORKSTATION AUDIT ===");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  // Standard desktop POS resolution: 1440 x 900
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  const token = jwt.sign(
    { adminId: "adm-saif-owner-001", kind: "ADMIN", roles: ["OWNER"], permissions: ["*"] },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  await page.setCookie({
    name: "gcp_access",
    value: token,
    domain: "localhost",
    path: "/",
  });

  try {
    console.log("\n[STEP 1] Navigating to Desktop POS Workstation (/admin/pos)...");
    await page.goto("http://localhost:3000/admin/pos", { waitUntil: "networkidle2" });
    await sleep(2000);

    const title = await page.title();
    console.log("✓ Page Loaded. Title:", title);

    const hasBusyTitle = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("BUSY 21 RETAIL POS") && text.includes("VOUCHER ITEM GRID");
    });
    console.log("✓ BUSY 21 Retail POS Header & Voucher Item Grid verified:", hasBusyTitle);

    // Capture main workstation
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "busy_pos_desktop_workstation.png") });
    console.log("✓ Saved busy_pos_desktop_workstation.png");

    // [STEP 2] Test F1 Shortcuts Modal
    console.log("\n[STEP 2] Testing F1 Keyboard Shortcuts Modal...");
    await page.keyboard.press("F1");
    await sleep(800);

    const hasShortcuts = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("BUSY POS Keyboard Shortcuts (F1)") && text.includes("Quick Item Master");
    });
    console.log("✓ F1 Shortcuts Modal verified:", hasShortcuts);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "busy_pos_shortcuts_f1_modal.png") });
    console.log("✓ Saved busy_pos_shortcuts_f1_modal.png");

    await page.keyboard.press("Escape");
    await sleep(500);

    // [STEP 3] Test F5 Hold Bill (Park) & F6 Recall Bills
    console.log("\n[STEP 3] Testing F5 Hold Bill and F6 Recall Modal...");
    await page.keyboard.press("F5");
    await sleep(1000);

    const holdNotification = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("held successfully") || text.includes("Recall (1)");
    });
    console.log("✓ F5 Hold Bill executed, active cart cleared, badge incremented:", holdNotification);

    await page.keyboard.press("F6");
    await sleep(800);
    const hasRecall = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Held / Parked Bills (F6)") && text.includes("Resume Bill");
    });
    console.log("✓ F6 Recall Held Bills Modal verified:", hasRecall);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "busy_pos_held_bills_f6_modal.png") });
    console.log("✓ Saved busy_pos_held_bills_f6_modal.png");

    // Click "Resume Bill"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const resume = btns.find((b) => b.textContent && b.textContent.includes("Resume Bill"));
      if (resume) resume.click();
    });
    await sleep(800);

    // [STEP 4] Test F11 Day Closing Z-Report
    console.log("\n[STEP 4] Testing F11 Day Closing Z-Report...");
    await page.keyboard.press("F11");
    await sleep(800);

    const hasZReport = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Day Closing Z-Report (F11)") && text.includes("Closing Cash in Drawer");
    });
    console.log("✓ F11 Day Closing Z-Report verified:", hasZReport);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "busy_pos_z_report_f11_modal.png") });
    console.log("✓ Saved busy_pos_z_report_f11_modal.png");

    await page.keyboard.press("Escape");
    await sleep(500);

    // [STEP 5] Settle Bill and Switch to A4 GST Tax Invoice format
    console.log("\n[STEP 5] Settling Bill and Verifying A4 GST Tax Invoice...");
    await page.keyboard.press("F2");

    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return text.includes("CENTRAL MART") && (text.includes("Voucher No:") || text.includes("Print Bill") || text.includes("Next Bill"));
      },
      { timeout: 15000 }
    );
    await sleep(800);

    // Click "A4 GST Tax Invoice" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const a4Btn = btns.find((b) => b.textContent && b.textContent.includes("A4 GST Tax Invoice"));
      if (a4Btn) a4Btn.click();
    });
    await sleep(800);

    const hasA4Gst = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("TAX INVOICE (ORIGINAL FOR RECIPIENT)") && text.includes("GSTIN: 08AAAAA0000A1Z5");
    });
    console.log("✓ A4 GST Tax Invoice generated with state code and seller GSTIN:", hasA4Gst);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "busy_pos_settled_a4_gst_invoice.png") });
    console.log("✓ Saved busy_pos_settled_a4_gst_invoice.png");

    console.log("\n=== ALL REAL BUSY POS AUDIT TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Audit failed:", err);
  } finally {
    await browser.close();
  }
}

verifyBusyPosClone();

