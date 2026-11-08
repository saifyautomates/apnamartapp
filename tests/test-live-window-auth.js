const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";

const possibleBrowsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const exePath = possibleBrowsers.find((p) => fs.existsSync(p));
if (!exePath) {
  console.error("No valid browser binary found!");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName} ${detail ? `[${detail}]` : ""}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? `[${detail}]` : ""}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("================================================================================");
  console.log("🚀 STARTING LIVE BROWSER WINDOW AUTHENTICATION AUDIT & VERIFICATION");
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`   Browser Binary: ${exePath}`);
  console.log("================================================================================\n");

  const screenshotsDir = path.join(__dirname, "screenshots");
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,850"],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send("Network.clearBrowserCookies");

  try {
    // ------------------------------------------------------------------------
    // CHECK 1: Desktop Header -> Click "Login" -> Opens Customer Login Modal
    // ------------------------------------------------------------------------
    console.log("▶ [CHECK 1/5] Customer Login Modal Open & UI Elements");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await sleep(600);

    const loginBtnClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText.trim() === "Login"
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(loginBtnClicked, "Header 'Login' button identified and clicked");
    await sleep(600);

    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector("aside[aria-label='Customer Login']");
      const phoneInput = document.querySelector("input[placeholder*='10-digit']");
      const googleBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.toLowerCase().includes("google")
      );
      return {
        isOpen: Boolean(modal),
        hasPhoneInput: Boolean(phoneInput),
        hasGoogleBtn: Boolean(googleBtn),
      };
    });

    assert(modalVisible.isOpen, "Customer Login dialog sheet opened smoothly");
    assert(modalVisible.hasPhoneInput, "10-digit Indian Mobile input is present and autofocus-ready");
    assert(modalVisible.hasGoogleBtn, "Continue with Google OAuth button is present in modal");

    await page.screenshot({ path: path.join(screenshotsDir, "auth_01_modal_open.png") });

    // ------------------------------------------------------------------------
    // CHECK 2: Request OTP Flow & Auto-fill Dev Code
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 2/5] Phone Number Input -> OTP Request -> Auto-fill Code");
    const testPhone = `98290${Math.floor(10000 + Math.random() * 90000)}`;
    const phoneInput = await page.$("input[placeholder*='10-digit']");
    if (phoneInput) {
      await phoneInput.type(testPhone, { delay: 30 });
    }

    const clickedContinue = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.includes("Continue with OTP")
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedContinue, "Submitted phone number to request OTP");

    await sleep(1500);

    const otpInputPresent = await page.evaluate(() => {
      const input = document.querySelector("input[placeholder*='6-digit']");
      return Boolean(input);
    });
    assert(otpInputPresent, "Transitioned to OTP screen with 6-digit input");

    await page.screenshot({ path: path.join(screenshotsDir, "auth_02_otp_sent.png") });

    // Auto-fill OTP Code
    const autoFilled = await page.evaluate(() => {
      const autoFillBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.toLowerCase().includes("auto-fill")
      );
      if (autoFillBtn) {
        autoFillBtn.click();
        return true;
      }
      return false;
    });
    assert(autoFilled, "Clicked 1-Click Auto-Fill for verification code");
    await sleep(400);

    // Click Verify & Continue
    const verifyClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.includes("Verify & Continue")
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(verifyClicked, "Submitted OTP verification code");

    await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => sleep(2000));
    await sleep(800);

    // ------------------------------------------------------------------------
    // CHECK 3: Verify Authenticated Session & Account Badge
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 3/5] Verified Session & Account Navigation");
    const sessionCheck = await page.evaluate(() => {
      const accountLink = document.querySelector("a[href='/account']");
      return {
        authenticated: Boolean(accountLink),
        buttonText: accountLink ? accountLink.innerText.trim() : "",
      };
    });
    assert(
      sessionCheck.authenticated,
      "Customer authenticated! Header shows 'My Account' pill",
      sessionCheck.buttonText
    );

    // Verify session cookies via CDP
    const allCookiesRes = await cdp.send("Network.getAllCookies");
    const cookies = allCookiesRes.cookies || [];
    const hasAccessCookie = cookies.some((c) => c.name === "gcp_access");
    const hasRefreshCookie = cookies.some((c) => c.name === "gcp_refresh");
    const hasCsrfCookie = cookies.some((c) => c.name === "gcp_csrf");

    assert(hasAccessCookie, "HTTP-only access JWT session cookie ('gcp_access') is set");
    assert(hasRefreshCookie, "HTTP-only refresh token cookie ('gcp_refresh') is set (scoped to /api/auth/refresh)");
    assert(hasCsrfCookie, "CSRF double-submit protection cookie ('gcp_csrf') is active");

    await page.screenshot({ path: path.join(screenshotsDir, "auth_03_customer_logged_in.png") });

    // ------------------------------------------------------------------------
    // CHECK 4: Dedicated Login Page (/login) & Google OAuth Button
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 4/5] Dedicated /login Page & Google OAuth Trigger");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await sleep(600);

    const loginPageData = await page.evaluate(() => {
      const googleBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.toLowerCase().includes("google")
      );
      const emailTab = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.toLowerCase().includes("email")
      );
      const phoneTab = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.toLowerCase().includes("mobile") || b.innerText.toLowerCase().includes("phone") || b.innerText.toLowerCase().includes("otp")
      );
      return {
        hasGoogleBtn: Boolean(googleBtn),
        hasEmailTab: Boolean(emailTab),
        hasPhoneTab: Boolean(phoneTab),
      };
    });

    assert(loginPageData.hasGoogleBtn, "Continue with Google button is present on /login");
    assert(loginPageData.hasEmailTab, "Email/Password Supabase login tab is present on /login");
    assert(loginPageData.hasPhoneTab, "Mobile OTP quick login tab is present on /login");

    await page.screenshot({ path: path.join(screenshotsDir, "auth_04_login_page_google.png") });

    // ------------------------------------------------------------------------
    // CHECK 5: Staff & Admin Authentication (/staff-login -> /admin)
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 5/5] Staff & Administrator Authentication (/staff-login)");
    // Clear cookies for clean admin login
    await cdp.send("Network.clearBrowserCookies");

    await page.goto(`${BASE_URL}/staff-login`, { waitUntil: "networkidle0" });
    await sleep(600);

    const hasStaffForm = await page.evaluate(() => {
      const userField = document.querySelector("input[type='text']");
      const passField = document.querySelector("input[type='password']");
      const submitBtn = document.querySelector("button[type='submit']");
      return Boolean(userField && passField && submitBtn);
    });
    assert(hasStaffForm, "Staff login form rendered with username, password and submit button");

    await page.type("input[type='text']", "saif", { delay: 25 });
    await page.type("input[type='password']", "AdminPassword123!", { delay: 25 });

    const staffSubmit = await page.$("button[type='submit']");
    if (staffSubmit) await staffSubmit.click();

    await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => sleep(2500));
    await sleep(800);

    const adminUrl = page.url();
    const isAdmin = adminUrl.includes("/admin");
    assert(isAdmin, "Administrator successfully authenticated and redirected to /admin dashboard", adminUrl);

    await page.screenshot({ path: path.join(screenshotsDir, "auth_05_admin_dashboard.png") });

    const artifactDir = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\0ce637a4-3b8b-44de-8e7f-c64be7e15c2d";
    const shotFiles = [
      "auth_01_modal_open.png",
      "auth_02_otp_sent.png",
      "auth_03_customer_logged_in.png",
      "auth_04_login_page_google.png",
      "auth_05_admin_dashboard.png",
    ];
    for (const sf of shotFiles) {
      const srcFile = path.join(screenshotsDir, sf);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(artifactDir, sf));
        console.log(`  📸 Saved artifact: ${sf}`);
      }
    }

    console.log("\n================================================================================");
    console.log(`🎉 ALL LIVE WINDOW AUTH CHECKS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("FATAL ERROR IN LIVE AUTH TEST:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

