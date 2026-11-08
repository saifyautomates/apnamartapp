const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(cond, name, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ PASS: ${name} ${detail ? `(${detail})` : ""}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ""}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runUiAuthTests() {
  console.log("================================================================================");
  console.log("🖥️ RIGOROUS UI AUTH TESTING (CUSTOMER MODAL & ADMIN LOGIN)");
  console.log(`   Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  // Clear any existing cookies to test clean state
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");

  try {
    // ------------------------------------------------------------------------
    // UI TEST 1: Customer Login Modal UI Flow
    // ------------------------------------------------------------------------
    console.log("▶ [UI CHECK 1/3] Customer Login Modal Open & Form");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await sleep(400);

    // Click Login Button in Desktop Header
    const clickedHeaderLogin = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.trim() === "Login");
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedHeaderLogin, "Clicked 'Login' button in header");

    await sleep(500);

    // Verify Login Modal is open
    const modalOpen = await page.evaluate(() => {
      const aside = document.querySelector("aside[aria-label='Customer Login']");
      const input = document.querySelector("input[placeholder*='10-digit']");
      return Boolean(aside && input);
    });
    assert(modalOpen, "Customer login dialog modal opened with phone input");

    // ------------------------------------------------------------------------
    // UI TEST 2: Instant OTP Verification via Auto-Fill & Submit
    // ------------------------------------------------------------------------
    console.log("\n▶ [UI CHECK 2/3] Phone Input -> OTP Send -> Auto-Fill -> Verified Session");
    const testPhone = `98290${Math.floor(10000 + Math.random() * 90000)}`;
    const phoneInput = await page.$("input[placeholder*='10-digit']");
    if (phoneInput) {
      await phoneInput.type(testPhone, { delay: 30 });
    }

    // Click Continue with OTP Button
    const clickedContinue = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Continue with OTP"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(clickedContinue, "Clicked 'Continue with OTP →'");

    // Wait for OTP request API call to finish
    await sleep(1500);

    // Check OTP screen is displayed
    const otpScreenOpen = await page.evaluate(() => {
      const otpInput = document.querySelector("input[placeholder*='6-digit']");
      return Boolean(otpInput);
    });
    assert(otpScreenOpen, "OTP entry view displayed with 6-digit input");

    // Click Auto-Fill button for dev test OTP
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
    assert(autoFilled, "Clicked 'Auto-Fill' to insert test OTP code");

    await sleep(400);

    // Click Verify & Continue
    const clickedVerify = await page.evaluate(() => {
      const verifyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("Verify & Continue"));
      if (verifyBtn) {
        verifyBtn.click();
        return true;
      }
      return false;
    });
    assert(clickedVerify, "Clicked 'Verify & Continue →'");

    // Wait for page reload to complete
    await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => sleep(2000));
    await sleep(500);

    // Verify user is logged in
    const accountState = await page.evaluate(() => {
      const accountLink = document.querySelector("a[href='/account']");
      return {
        isLoggedIn: Boolean(accountLink),
        text: accountLink ? accountLink.innerText : "",
      };
    });
    assert(accountState.isLoggedIn, "User is authenticated and Account link appears in Header", accountState.text);

    // ------------------------------------------------------------------------
    // UI TEST 3: Admin & Staff Login Page (/staff-login)
    // ------------------------------------------------------------------------
    console.log("\n▶ [UI CHECK 3/3] Staff & Admin Login (/staff-login)");
    await page.goto(`${BASE_URL}/staff-login`, { waitUntil: "networkidle0" });
    await sleep(500);

    const hasStaffLoginForm = await page.evaluate(() => {
      const userIn = document.querySelector("input[placeholder*='username']") || document.querySelector("input[type='text']");
      const passIn = document.querySelector("input[type='password']");
      return Boolean(userIn && passIn);
    });
    assert(hasStaffLoginForm, "Staff/Admin Login form rendered with username & password fields");

    // Fill credentials & submit
    await page.type("input[type='text']", "saif", { delay: 30 });
    await page.type("input[type='password']", "AdminPassword123!", { delay: 30 });

    const submitBtn = await page.$("button[type='submit']");
    if (submitBtn) {
      await submitBtn.click();
      await sleep(2000);
    }

    const currentUrl = page.url();
    const isAdminDashboard = currentUrl.includes("/admin");
    assert(isAdminDashboard, "Admin redirected to Admin Dashboard after successful login", currentUrl);

    console.log("\n================================================================================");
    console.log(`🎉 ALL UI AUTH TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
  } catch (err) {
    console.error("FATAL UI AUTH ERROR:", err);
  } finally {
    await browser.close();
  }
}

runUiAuthTests();
