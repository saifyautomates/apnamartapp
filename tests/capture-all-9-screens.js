const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const ARTIFACT_DIR = "C:\\Users\\jackx\\.gemini\\antigravity\\brain\\0ce637a4-3b8b-44de-8e7f-c64be7e15c2d";
const JWT_SECRET = "grocery-commerce-platform-dev-secret-key-2026-very-secure-jwt";

const ALL_PERMS = [
  "dashboard:read", "orders:read", "orders:write", "products:read", "products:write",
  "categories:write", "inventory:read", "inventory:write", "customers:read", "customers:write",
  "offers:write", "coupons:write", "delivery:write", "payments:read", "payments:write",
  "loyalty:write", "credit:write", "reports:read", "integrations:read", "integrations:write",
  "users:read", "users:write", "settings:write", "audit:read"
];

function makeAdminToken() {
  return jwt.sign(
    {
      kind: "ADMIN",
      userId: "usr_admin_001",
      email: "admin@centralmart.in",
      role: "SUPER_ADMIN",
      permissions: ALL_PERMS,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function makeCustomerToken() {
  return jwt.sign(
    {
      kind: "CUSTOMER",
      userId: "cust_demo_001",
      phone: "+919876543210",
      name: "Jack Demo",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function run() {
  console.log("Starting Chrome via Puppeteer-core...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=430,932"],
  });

  const page = await browser.newPage();
  // Standard iPhone 14 Pro Max viewport matching mockup screens 1-8
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });

  const adminToken = makeAdminToken();
  const customerToken = makeCustomerToken();

  // Helper to capture mobile screenshot
  async function snap(url, filename, cookieToken = null) {
    if (cookieToken) {
      await page.setCookie({
        name: "gcp_access",
        value: cookieToken,
        domain: "localhost",
        path: "/",
      });
    }
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
    const outPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  ✓ Saved screenshot: ${filename}`);
  }

  try {
    // 1. Screen 1: Splash / Onboarding
    await snap(`${BASE_URL}/welcome`, "screen_01_welcome.png");

    // 2. Screen 2: Home Feed
    await snap(`${BASE_URL}/`, "screen_02_home_feed.png");

    // 3. Screen 3: Categories Page
    await snap(`${BASE_URL}/category`, "screen_03_categories.png");

    // 4. Screen 4: Category Products Listing
    await snap(`${BASE_URL}/category/snacks`, "screen_04_category_products.png");

    // 5. Screen 5: Product Details Page (PDP)
    await snap(`${BASE_URL}/product/lays-classic-salted-potato-chips`, "screen_05_product_details.png");

    // Populate cart with 2 demo items so /cart matches Screen 6 perfectly
    console.log("Adding items to cart for Screen 6...");
    await page.evaluate(async () => {
      try {
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        const items = prodData?.data?.items || [];
        if (items.length > 0) {
          const var1 = items[0].variants?.[0]?.id || items[0].id;
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: var1, qty: 1 }),
          });
        }
        if (items.length > 1) {
          const var2 = items[1].variants?.[0]?.id || items[1].id;
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: var2, qty: 2 }),
          });
        }
      } catch (err) {
        console.error("Cart populate error:", err);
      }
    });

    // 6. Screen 6: My Cart
    await snap(`${BASE_URL}/cart`, "screen_06_cart.png");

    // 7. Screen 7: Track Order
    await snap(`${BASE_URL}/orders/ord-cm12345`, "screen_07_track_order.png", customerToken);

    // 8. Screen 8: My Orders
    await snap(`${BASE_URL}/orders`, "screen_08_my_orders.png", customerToken);

    // 9. Screen 9: Admin Dashboard (Desktop Viewport matching mockup)
    console.log("Setting desktop viewport for Screen 9 Admin Dashboard...");
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await snap(`${BASE_URL}/admin`, "screen_09_admin_dashboard.png", adminToken);

    console.log("\n ALL 9 SCREENS CAPTURED SUCCESSFULLY IN ARTIFACT DIRECTORY!");
  } catch (err) {
    console.error("Puppeteer crawl error:", err);
  } finally {
    await browser.close();
  }
}

run();

