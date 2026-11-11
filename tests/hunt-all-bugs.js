const http = require("http");

const BASE = "http://localhost:3000";

const bugs = [];

function recordBug(severity, area, title, detail, reproduction) {
  bugs.push({ severity, area, title, detail, reproduction });
  console.log(`\n🚨 [${severity}] ${area}: ${title}`);
  console.log(`   Detail: ${detail}`);
  if (reproduction) console.log(`   Repro: ${reproduction}`);
}

async function request(path, opts = {}) {
  const url = new URL(path, BASE);
  return new Promise((resolve) => {
    const req = http.request(
      url,
      {
        method: opts.method || "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(opts.headers || {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      }
    );
    req.on("error", (e) => resolve({ status: 0, error: e.message }));
    if (opts.body) req.write(typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

async function runBugHunt() {
  console.log("================================================================================");
  console.log("🕵️ STARTING DEEP CODEBASE BUG HUNT & PENETRATION AUDIT");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. CSRF & Auth Cookie Handling
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing CSRF, Auth & Token Expiry ---");
  const csrfRes = await request("/api/auth/csrf");
  const csrfCookie = (csrfRes.headers["set-cookie"] || []).find((c) => c.includes("gcp_csrf"));
  const csrfToken = csrfRes.json?.data?.csrfToken;

  if (!csrfCookie || !csrfToken) {
    recordBug(
      "HIGH",
      "Authentication",
      "CSRF token generation missing or malformed",
      `Expected gcp_csrf cookie and token, got status ${csrfRes.status}`,
      "GET /api/auth/csrf"
    );
  }

  // Test what happens if we call a POST endpoint with mismatching CSRF token
  const badCsrfRes = await request("/api/auth/request-otp", {
    method: "POST",
    headers: { "x-csrf-token": "bad-token-12345", Cookie: csrfCookie },
    body: { phone: "9829012345" },
  });
  if (badCsrfRes.status !== 403) {
    recordBug(
      "HIGH",
      "Security",
      "CSRF verification bypass or improper status code",
      `Expected status 403 Forbidden on invalid CSRF token, but got status ${badCsrfRes.status}`,
      "POST /api/auth/request-otp with mismatched x-csrf-token"
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Auth Callback & Google OAuth Redirect
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing Google OAuth /auth/callback Edge Cases ---");
  // Test invalid code
  const oauthInvalidRes = await request("/auth/callback?code=invalid_dummy_code_9999");
  // Should redirect to error or next without 500 crashing
  if (oauthInvalidRes.status >= 500) {
    recordBug(
      "HIGH",
      "OAuth",
      "/auth/callback crashes with 500 on invalid OAuth exchange code",
      `Server returned ${oauthInvalidRes.status} instead of graceful redirect to /login`,
      "GET /auth/callback?code=invalid_dummy_code_9999"
    );
  }

  // Test missing code
  const oauthNoCodeRes = await request("/auth/callback");
  if (oauthNoCodeRes.status >= 500) {
    recordBug(
      "MEDIUM",
      "OAuth",
      "/auth/callback crashes on missing code parameter",
      `Server returned ${oauthNoCodeRes.status}`,
      "GET /auth/callback"
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Cart & Pricing Edge Cases
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Cart & Pricing Edge Cases ---");
  // Test adding fake variantId
  const fakeVariantRes = await request("/api/cart", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { variantId: "fake-variant-uuid-99999", qty: 1 },
  });
  if (fakeVariantRes.status >= 500) {
    recordBug(
      "HIGH",
      "Cart Engine",
      "Adding non-existent variantId causes 500 Internal Server Error",
      `Expected 404 or 400 validation error, got ${fakeVariantRes.status}`,
      "POST /api/cart with variantId='fake-variant-uuid-99999'"
    );
  }

  // Test adding zero or negative quantity
  const zeroQtyRes = await request("/api/cart", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { variantId: "some-variant", qty: 0 },
  });
  if (zeroQtyRes.status !== 400) {
    recordBug(
      "MEDIUM",
      "Cart Engine",
      "Adding qty=0 to cart is not rejected by validation schema",
      `Expected status 400 Bad Request, got ${zeroQtyRes.status}`,
      "POST /api/cart with qty=0"
    );
  }

  // Test adding massive quantity (> 100)
  const hugeQtyRes = await request("/api/cart", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { variantId: "some-variant", qty: 999999 },
  });
  if (hugeQtyRes.status !== 400) {
    recordBug(
      "MEDIUM",
      "Cart Engine",
      "Adding qty=999999 is not rejected by max validation limit",
      `Expected 400 Bad Request, got ${hugeQtyRes.status}`,
      "POST /api/cart with qty=999999"
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Checkout Validation & Tamper Protection
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Testing Checkout Validation & Tamper Resistance ---");
  // Unauthenticated checkout attempt
  const unauthCheckout = await request("/api/checkout", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { deliveryMethod: "DELIVERY", paymentMethod: "COD" },
  });
  if (unauthCheckout.status !== 401 && unauthCheckout.status !== 403) {
    recordBug(
      "HIGH",
      "Checkout",
      "Unauthenticated user can invoke checkout endpoint without 401/403",
      `Expected 401 Unauthorized, got ${unauthCheckout.status}`,
      "POST /api/checkout without session token"
    );
  }

  // ---------------------------------------------------------------------------
  // 5. In-Store POS & Billing Edge Cases
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Testing In-Store POS & Billing Edge Cases ---");
  // Test POS checkout without admin session
  const unauthPos = await request("/api/admin/pos/checkout", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { items: [{ name: "Test Item", qty: 1, sellingPaise: 1000 }] },
  });
  if (unauthPos.status !== 401 && unauthPos.status !== 403) {
    recordBug(
      "CRITICAL",
      "POS Billing",
      "In-store POS checkout accessible without Admin credentials",
      `Expected 401/403, got status ${unauthPos.status}`,
      "POST /api/admin/pos/checkout without admin cookie"
    );
  }

  // Admin Login to test POS authenticated edge cases
  const adminLogin = await request("/api/auth/admin/login", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: { username: "saif", password: "AdminPassword123!" },
  });
  const adminCookies = (adminLogin.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");

  if (adminLogin.status === 200) {
    // Test POS checkout with empty items array
    const emptyPos = await request("/api/admin/pos/checkout", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken, Cookie: `${csrfCookie}; ${adminCookies}` },
      body: { items: [] },
    });
    if (emptyPos.status >= 500) {
      recordBug(
        "HIGH",
        "POS Billing",
        "POS checkout crashes with 500 on empty items array",
        `Expected 400 Bad Request, got ${emptyPos.status}`,
        "POST /api/admin/pos/checkout with items=[]"
      );
    }

    // Test Quick Add: MRP less than Selling Price (Illegal under Indian Law)
    const illegalPriceAdd = await request("/api/admin/products/quick-add", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken, Cookie: `${csrfCookie}; ${adminCookies}` },
      body: {
        barcode: "8909990001112",
        name: "Test Illegal Pricing Item",
        categoryId: "00000000-0000-0000-0000-000000000001",
        mrpPaise: 1000,
        sellingPaise: 2000, // Selling above MRP!
      },
    });
    // In our quick-add route: Math.min(parsedMrp, Math.max(100, sellingPaise))
    // Let's verify if sellingPaise was capped at MRP or allowed higher
    if (illegalPriceAdd.json?.data?.variant?.sellingPaise > illegalPriceAdd.json?.data?.variant?.mrpPaise) {
      recordBug(
        "CRITICAL",
        "Compliance",
        "Quick Add allows selling price higher than MRP (Violates Indian Metrology Act)",
        `Selling price ${illegalPriceAdd.json.data.variant.sellingPaise} > MRP ${illegalPriceAdd.json.data.variant.mrpPaise}`,
        "POST /api/admin/products/quick-add with sellingPaise > mrpPaise"
      );
    }

    // Test Quick Add: Duplicate Barcode
    const dupBarcode1 = await request("/api/admin/products/quick-add", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken, Cookie: `${csrfCookie}; ${adminCookies}` },
      body: {
        barcode: "8901234567890",
        name: "Duplicate Barcode Test Item 1",
        categoryId: "00000000-0000-0000-0000-000000000001",
        mrpPaise: 5000,
        sellingPaise: 4500,
      },
    });
    const dupBarcode2 = await request("/api/admin/products/quick-add", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken, Cookie: `${csrfCookie}; ${adminCookies}` },
      body: {
        barcode: "8901234567890", // SAME BARCODE
        name: "Duplicate Barcode Test Item 2",
        categoryId: "00000000-0000-0000-0000-000000000001",
        mrpPaise: 6000,
        sellingPaise: 5500,
      },
    });
    if (dupBarcode2.status >= 500) {
      recordBug(
        "HIGH",
        "Admin Catalogue",
        "Quick Add crashes with 500 on duplicate barcode collision",
        `Server threw 500 error instead of clean validation message: ${dupBarcode2.body}`,
        "POST /api/admin/products/quick-add with existing barcode"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Search Injection & Typos
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Testing Search Vulnerabilities & Edge Cases ---");
  const sqlSearch = await request("/api/search?q=' OR 1=1 --");
  if (sqlSearch.status >= 500) {
    recordBug(
      "HIGH",
      "Search Engine",
      "Search crashes with 500 on SQL characters",
      `Query "' OR 1=1 --" caused status ${sqlSearch.status}`,
      "GET /api/search?q=' OR 1=1 --"
    );
  }

  const xssSearch = await request("/api/search?q=<script>alert(1)</script>");
  if (xssSearch.status >= 500) {
    recordBug(
      "HIGH",
      "Search Engine",
      "Search crashes with 500 on HTML/script tags",
      `Query "<script>..." caused status ${xssSearch.status}`,
      "GET /api/search?q=<script>alert(1)</script>"
    );
  }

  // Search with empty or whitespace
  const emptySearch = await request("/api/search?q=%20%20%20");
  if (emptySearch.status >= 500) {
    recordBug(
      "MEDIUM",
      "Search Engine",
      "Search crashes with 500 on whitespace query",
      `Query '   ' caused status ${emptySearch.status}`,
      "GET /api/search?q=%20%20%20"
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Missing Dynamic Pages (404 Handling)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Testing Missing Dynamic Pages & Routes ---");
  const missingOrder = await request("/orders/00000000-0000-0000-0000-000000000000");
  if (missingOrder.status >= 500) {
    recordBug(
      "HIGH",
      "Orders",
      "Viewing non-existent order ID crashes with 500 instead of 404",
      `Status ${missingOrder.status}`,
      "GET /orders/00000000-0000-0000-0000-000000000000"
    );
  }

  const missingCategory = await request("/category/non-existent-cat-slug-xyz");
  if (missingCategory.status >= 500) {
    recordBug(
      "HIGH",
      "Category",
      "Viewing non-existent category slug crashes with 500 instead of 404",
      `Status ${missingCategory.status}`,
      "GET /category/non-existent-cat-slug-xyz"
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Order Cancellation Security (IDOR Vulnerability Check)
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Testing Order Cancellation & IDOR Boundaries ---");
  const cancelUnauth = await request("/api/orders/some-random-order-id/cancel", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
  });
  if (cancelUnauth.status !== 401 && cancelUnauth.status !== 403) {
    recordBug(
      "CRITICAL",
      "Security / IDOR",
      "Anonymous user can call order cancel endpoint without 401/403",
      `Expected 401, got status ${cancelUnauth.status}`,
      "POST /api/orders/:id/cancel without auth session"
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Uploads Endpoint Security
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Testing Uploads Endpoint Security ---");
  const unauthUpload = await request("/api/uploads", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken, Cookie: csrfCookie },
    body: "fake binary payload",
  });
  if (unauthUpload.status !== 401 && unauthUpload.status !== 403) {
    recordBug(
      "HIGH",
      "Security / Storage",
      "Anonymous user can call /api/uploads without admin authorization",
      `Expected 401/403, got status ${unauthUpload.status}`,
      "POST /api/uploads without admin session"
    );
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`📊 BUG HUNT AUDIT FINISHED: ${bugs.length} ISSUES/BUGS IDENTIFIED`);
  console.log("================================================================================\n");

  for (let i = 0; i < bugs.length; i++) {
    const b = bugs[i];
    console.log(`${i + 1}. [${b.severity}] (${b.area}) ${b.title}`);
  }
}

runBugHunt().catch(console.error);
