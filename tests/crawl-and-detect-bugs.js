const puppeteer = require("puppeteer-core");
const fs = require("fs");

const possibleBrowsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const exePath = possibleBrowsers.find((p) => fs.existsSync(p));

const BASE = "http://localhost:3000";

const routesToTest = [
  { path: "/", auth: "none", name: "Homepage" },
  { path: "/category", auth: "none", name: "All Categories" },
  { path: "/category/staples", auth: "none", name: "Category Staples" },
  { path: "/category/dairy", auth: "none", name: "Category Dairy" },
  { path: "/category/snacks", auth: "none", name: "Category Snacks" },
  { path: "/product/amul-butter", auth: "none", name: "Product PDP Butter" },
  { path: "/product/aashirvaad-shudh-chakki-atta", auth: "none", name: "Product PDP Atta" },
  { path: "/cart", auth: "none", name: "Shopping Cart" },
  { path: "/checkout", auth: "customer", name: "Checkout Page" },
  { path: "/login", auth: "none", name: "Customer Login" },
  { path: "/staff-login", auth: "none", name: "Staff Login" },
  { path: "/account", auth: "customer", name: "Customer Account" },
  { path: "/orders", auth: "customer", name: "Customer Orders" },
  { path: "/admin", auth: "admin", name: "Admin Dashboard" },
  { path: "/admin/pos", auth: "admin", name: "Admin POS Billing" },
  { path: "/admin/products", auth: "admin", name: "Admin Products" },
  { path: "/admin/offers", auth: "admin", name: "Admin Offers" },
  { path: "/admin/inventory", auth: "admin", name: "Admin Inventory" },
  { path: "/admin/orders", auth: "admin", name: "Admin Orders" },
  { path: "/admin/reports", auth: "admin", name: "Admin Reports" },
  { path: "/admin/delivery", auth: "admin", name: "Admin Delivery Zones" },
  { path: "/admin/banners", auth: "admin", name: "Admin Banners" },
  { path: "/admin/bulk", auth: "admin", name: "Admin Bulk Catalogue" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCrawl() {
  console.log("================================================================================");
  console.log("🕷️ STARTING FULL-SITE 23-ROUTE CRAWL & CONSOLE/NETWORK BUG DETECTION");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: exePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,850"],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();

  const issuesFound = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known favicon 404 or benign hydration warnings if any
      issuesFound.push({ type: "CONSOLE_ERROR", route: page.url(), message: text });
      console.log(`  ⚠️ Console Error on [${page.url()}]: ${text.slice(0, 160)}`);
    }
  });

  page.on("pageerror", (err) => {
    issuesFound.push({ type: "UNHANDLED_EXCEPTION", route: page.url(), message: err.message });
    console.log(`  🚨 Page Crash on [${page.url()}]: ${err.message}`);
  });

  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes("favicon") && !url.includes(".map")) {
      issuesFound.push({ type: "FAILED_HTTP", route: page.url(), subUrl: url, status });
      console.log(`  ❌ HTTP ${status} on [${url}] requested by [${page.url()}]`);
    }
  });

  // 1. Establish Guest Page (no cookies)
  const guestPage = page;

  // 2. Establish Customer Auth Session (separate incognito/context)
  console.log("Setting up Customer Test Session...");
  const customerContext = await browser.createBrowserContext();
  const customerPage = await customerContext.newPage();
  
  customerPage.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      issuesFound.push({ type: "CONSOLE_ERROR", route: customerPage.url(), message: text });
      console.log(`  ⚠️ Console Error on [${customerPage.url()}]: ${text.slice(0, 160)}`);
    }
  });
  customerPage.on("pageerror", (err) => {
    issuesFound.push({ type: "UNHANDLED_EXCEPTION", route: customerPage.url(), message: err.message });
    console.log(`  🚨 Page Crash on [${customerPage.url()}]: ${err.message}`);
  });
  customerPage.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes("favicon") && !url.includes(".map")) {
      issuesFound.push({ type: "FAILED_HTTP", route: customerPage.url(), subUrl: url, status });
      console.log(`  ❌ HTTP ${status} on [${url}] requested by [${customerPage.url()}]`);
    }
  });

  await customerPage.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  const testPhone = "9829" + Math.floor(100000 + Math.random() * 900000);
  const customerLogin = await customerPage.evaluate(async (base, phone) => {
    const csrfRes = await fetch(`${base}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const token = csrfData.data?.csrfToken;
    const otpRes = await fetch(`${base}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({ phone }),
    });
    const otpData = await otpRes.json();
    const code = otpData.data?.devOtp;
    if (!code) return false;
    const verifyRes = await fetch(`${base}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({ phone, code }),
    });
    return verifyRes.ok;
  }, BASE, testPhone);
  console.log("Customer logged in:", customerLogin);

  // 3. Establish Admin Auth Session (separate context)
  const adminContext = await browser.createBrowserContext();
  const adminPage = await adminContext.newPage();
  adminPage.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      issuesFound.push({ type: "CONSOLE_ERROR", route: adminPage.url(), message: text });
      console.log(`  ⚠️ Console Error on [${adminPage.url()}]: ${text.slice(0, 160)}`);
    }
  });
  adminPage.on("pageerror", (err) => {
    issuesFound.push({ type: "UNHANDLED_EXCEPTION", route: adminPage.url(), message: err.message });
    console.log(`  🚨 Page Crash on [${adminPage.url()}]: ${err.message}`);
  });
  adminPage.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes("favicon") && !url.includes(".map")) {
      issuesFound.push({ type: "FAILED_HTTP", route: adminPage.url(), subUrl: url, status });
      console.log(`  ❌ HTTP ${status} on [${url}] requested by [${adminPage.url()}]`);
    }
  });

  console.log("Setting up Admin Test Session...");
  await adminPage.goto(`${BASE}/staff-login`, { waitUntil: "networkidle0" });
  await adminPage.type("input[type='text']", "saif");
  await adminPage.type("input[type='password']", "AdminPassword123!");
  const submitBtn = await adminPage.$("button[type='submit']");
  if (submitBtn) await submitBtn.click();
  await adminPage.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => sleep(2000));
  console.log("Admin logged in. Current URL:", adminPage.url());

  // 4. Crawl routes
  for (const r of routesToTest) {
    const p = r.auth === "admin" ? adminPage : r.auth === "customer" ? customerPage : guestPage;
    const targetUrl = `${BASE}${r.path}`;
    console.log(`\n▶ Checking: [${r.name}] -> ${targetUrl}`);

    try {
      const response = await p.goto(targetUrl, { waitUntil: "networkidle0", timeout: 15000 });
      const status = response ? response.status() : 0;
      if (status >= 400) {
        issuesFound.push({ type: "ROUTE_HTTP_ERROR", route: targetUrl, status });
        console.log(`  🚨 Route returned HTTP status ${status}!`);
      }

      // Smooth scroll down through entire page to trigger lazy loaded images
      await p.evaluate(async () => {
        const totalHeight = document.scrollingElement.scrollHeight;
        let distance = 500;
        let currentPos = 0;
        while (currentPos < totalHeight) {
          window.scrollBy(0, distance);
          currentPos += distance;
          await new Promise((r) => setTimeout(r, 60));
        }
        await new Promise((r) => setTimeout(r, 400));
        window.scrollTo(0, 0);
      });
      await sleep(300);

      // Check truly broken images (images where decode failed or returned 0 natural dimensions)
      const brokenImages = await p.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs
          .filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:"))
          .map((i) => ({ src: i.src, alt: i.alt }));
      });

      if (brokenImages.length > 0) {
        issuesFound.push({
          type: "BROKEN_IMAGES",
          route: targetUrl,
          images: brokenImages,
        });
        console.log(`  ⚠️ Found ${brokenImages.length} broken image(s) on ${r.name}`);
        brokenImages.slice(0, 3).forEach((img) => console.log(`     - ${img.src}`));
      } else {
        console.log(`  ✅ All images rendered cleanly (${brokenImages.length} broken)`);
      }
    } catch (err) {
      issuesFound.push({ type: "NAVIGATION_TIMEOUT_OR_CRASH", route: targetUrl, error: err.message });
      console.log(`  🚨 Failed loading ${targetUrl}: ${err.message}`);
    }
  }

  console.log("\n================================================================================");
  console.log(`📊 CRAWL COMPLETE: Found ${issuesFound.length} Total Warnings/Errors`);
  console.log("================================================================================\n");

  const byType = {};
  for (const iss of issuesFound) {
    byType[iss.type] = (byType[iss.type] || 0) + 1;
  }
  console.log("Issues breakdown by type:", byType);

  await browser.close();
}

runCrawl().catch(console.error);
