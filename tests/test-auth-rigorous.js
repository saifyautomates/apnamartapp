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

async function runAuthTests() {
  console.log("================================================================================");
  console.log("🔐 RIGOROUS CENTRAL MART AUTH VERIFICATION SUITE");
  console.log(`   Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: CSRF Token Generation
    // ------------------------------------------------------------------------
    console.log("▶ [CHECK 1/5] CSRF Token Endpoint (/api/auth/csrf)");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    const csrfRes = await page.evaluate(async () => {
      const res = await fetch("/api/auth/csrf");
      const json = await res.json();
      return { status: res.status, json };
    });

    assert(csrfRes.status === 200, "CSRF endpoint returns HTTP 200");
    const csrfToken = csrfRes.json?.data?.csrfToken;
    assert(Boolean(csrfToken && csrfToken.length >= 20), "Valid CSRF token generated", `Token: ${csrfToken?.slice(0, 8)}...`);

    // ------------------------------------------------------------------------
    // TEST 2: Customer Request OTP & Verify OTP
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 2/5] Customer OTP Flow (/api/auth/request-otp & verify-otp)");
    const testPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;

    const otpReq = await page.evaluate(async ({ phone, token }) => {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      return { status: res.status, json };
    }, { phone: testPhone, token: csrfToken });

    assert(otpReq.status === 200, "Request OTP returns HTTP 200");
    const devOtp = otpReq.json?.data?.devOtp;
    assert(Boolean(devOtp && devOtp.length === 6), "OTP generated successfully", `OTP: ${devOtp}`);

    // Verify OTP
    const verifyReq = await page.evaluate(async ({ phone, code, token }) => {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();
      return { status: res.status, json };
    }, { phone: testPhone, code: devOtp, token: csrfToken });

    assert(verifyReq.status === 200, "Verify OTP returns HTTP 200");
    const userId = verifyReq.json?.data?.user?.id;
    assert(Boolean(userId), "User account returned on verify", `User ID: ${userId}`);

    // ------------------------------------------------------------------------
    // TEST 3: Customer Session Verification (/api/auth/me)
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 3/5] Customer Session Verification (/api/auth/me)");
    const meReq = await page.evaluate(async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return { status: res.status, json };
    });

    assert(meReq.status === 200, "Session /api/auth/me returns HTTP 200");
    const sessionKind = meReq.json?.data?.session?.kind;
    const sessionUserId = meReq.json?.data?.session?.user?.id;
    assert(sessionKind === "CUSTOMER", "Session kind is CUSTOMER", sessionKind);
    assert(sessionUserId === userId, "Session userId matches verified user", sessionUserId);

    // ------------------------------------------------------------------------
    // TEST 4: Customer Logout (/api/auth/logout)
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 4/5] Customer Logout Flow (/api/auth/logout)");
    const logoutReq = await page.evaluate(async ({ token }) => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
      });
      const json = await res.json();
      return { status: res.status, json };
    }, { token: csrfToken });

    assert(logoutReq.status === 200, "Logout endpoint returns HTTP 200");

    // Verify session is cleared
    const afterLogout = await page.evaluate(async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return { status: res.status, json };
    });
    assert(afterLogout.json?.data?.session === null, "Session is cleared after logout");

    // ------------------------------------------------------------------------
    // TEST 5: Admin Login Flow (/api/auth/admin/login)
    // ------------------------------------------------------------------------
    console.log("\n▶ [CHECK 5/5] Admin Login Flow (/api/auth/admin/login)");
    const adminLoginRes = await page.evaluate(async ({ token }) => {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({
          username: "saif",
          password: "AdminPassword123!",
        }),
      });
      const json = await res.json();
      return { status: res.status, json };
    }, { token: csrfToken });

    assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");
    const adminRole = adminLoginRes.json?.data?.admin?.roles?.[0];
    assert(adminRole === "OWNER", "Admin user has OWNER role", adminRole);

    // Verify Admin Session via /api/auth/me
    const adminMeRes = await page.evaluate(async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return { status: res.status, json };
    });
    const adminSessionKind = adminMeRes.json?.data?.session?.kind;
    assert(adminSessionKind === "ADMIN", "Active session is ADMIN", adminSessionKind);

    console.log("\n================================================================================");
    console.log(`🎉 AUTH VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
  } catch (err) {
    console.error("FATAL ERROR IN AUTH TEST:", err);
  } finally {
    await browser.close();
  }
}

runAuthTests();

