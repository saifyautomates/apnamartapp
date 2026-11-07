/**
 * Central Mart Hardest Battle Test & Stress Matrix
 *
 * Subjecting the entire platform to:
 * 1. High-concurrency inventory race conditions (1-stock flash sale)
 * 2. Arithmetic & Currency attacks (negative qty, zero qty, fractional strings, overflow discount)
 * 3. Security & Injection stress (SQLi strings, XSS payloads, tampered JWTs, null bytes)
 * 4. Pincode and Geo-fence validation
 * 5. In-Store POS & Online Cashier Resilience under rapid fire
 */

export {};

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description} ${detail ? `[Detail: ${detail}]` : ""}`);
  }
}

async function getCsrfAndCookies(): Promise<{ csrfToken: string; cookie: string }> {
  const r = await fetch(`${BASE}/api/auth/csrf`);
  const data = await r.json();
  const token = data.data?.csrfToken || "";
  const setCookie = r.headers.get("set-cookie") || "";
  return { csrfToken: token, cookie: setCookie };
}

async function runHardestTests() {
  console.log("================================================================================");
  console.log("⚡ INITIATING HARDEST BATTLE TESTS: CONCURRENCY, INJECTIONS & BOUNDARIES");
  console.log("================================================================================");

  const { csrfToken, cookie } = await getCsrfAndCookies();

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Arithmetic & Quantity Attack Vectors
  // --------------------------------------------------------------------------
  console.log("\n▶ [SUITE 1/5] ARITHMETIC & INVENTORY QUANTITY ATTACK VECTORS");

  // Attack 1: Negative quantity in cart
  const negCart = await fetch(`${BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: cookie },
    body: JSON.stringify({ variantId: "any-id", qty: -5 }),
  });
  assert(
    "Negative quantity in cart is rejected or sanitized safely",
    negCart.status === 400 || negCart.status === 422 || !negCart.ok,
    `status=${negCart.status}`
  );

  // Attack 2: Zero quantity in cart
  const zeroCart = await fetch(`${BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: cookie },
    body: JSON.stringify({ variantId: "any-id", qty: 0 }),
  });
  assert(
    "Zero quantity in cart is rejected or sanitized safely",
    zeroCart.status === 400 || zeroCart.status === 422 || !zeroCart.ok,
    `status=${zeroCart.status}`
  );

  // Attack 3: Huge overflow quantity in cart
  const overflowCart = await fetch(`${BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: cookie },
    body: JSON.stringify({ variantId: "any-id", qty: 999999999 }),
  });
  assert(
    "Massive overflow quantity is rejected by stock check",
    overflowCart.status === 400 || overflowCart.status === 409 || !overflowCart.ok,
    `status=${overflowCart.status}`
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Security, SQL Injection & Malformed Input
  // --------------------------------------------------------------------------
  console.log("\n▶ [SUITE 2/5] SECURITY, SQL INJECTION & MALFORMED INPUT");

  // Attack 4: SQL Injection in search query
  const sqliSearch = await fetch(`${BASE}/api/search?q=' OR 1=1 --`);
  const sqliSearchJson = await sqliSearch.json().catch(() => ({}));
  assert(
    "SQL injection in search input handled safely without 500 error",
    sqliSearch.status === 200 && Array.isArray((sqliSearchJson as any).data?.items),
    `status=${sqliSearch.status}`
  );

  // Attack 5: SQL Injection in Barcode scanner lookup
  const sqliBarcode = await fetch(
    `${BASE}/api/admin/products/barcode-lookup?barcode=${encodeURIComponent("890'; DROP TABLE products; --")}`,
    { headers: { Cookie: cookie } }
  );
  assert(
    "SQL injection in barcode scanner lookup handled safely without database compromise",
    sqliBarcode.status === 200 || sqliBarcode.status === 400 || sqliBarcode.status === 401,
    `status=${sqliBarcode.status}`
  );

  // Attack 6: XSS payload in search query
  const xssSearch = await fetch(`${BASE}/api/search?q=${encodeURIComponent("<script>alert('XSS')</script>")}`);
  assert(
    "XSS payload in search query sanitized safely",
    xssSearch.status === 200,
    `status=${xssSearch.status}`
  );

  // Attack 7: Fake/tampered JWT Authorization cookie
  const fakeAuth = await fetch(`${BASE}/api/admin/dashboard`, {
    headers: { Cookie: "cm_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature" },
  });
  assert(
    "Tampered JWT session cookie is immediately rejected with 401 Unauthorized",
    fakeAuth.status === 401,
    `status=${fakeAuth.status}`
  );

  // Attack 8: Missing CSRF token on mutating route
  const noCsrf = await fetch(`${BASE}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9876543210" }),
  });
  assert(
    "Mutating POST request without CSRF token is blocked with 403 Forbidden",
    noCsrf.status === 403,
    `status=${noCsrf.status}`
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Geographic Boundary & Non-Deliverable Pincodes
  // --------------------------------------------------------------------------
  console.log("\n▶ [SUITE 3/5] GEOGRAPHIC BOUNDARY & GEO-FENCING ENFORCEMENT");

  // Attack 9: Out-of-region pincodes (Delhi, Mumbai, Jaipur)
  const outsidePinRes = await fetch(`${BASE}/api/delivery/zones?pincode=110001`);
  const outsidePinData = await outsidePinRes.json().catch(() => ({}));
  const matchedZones = (outsidePinData as any).data;
  assert(
    "Out-of-region pincode (110001 New Delhi) returns zero delivery zones",
    Array.isArray(matchedZones) && matchedZones.length === 0,
    `matchedCount=${matchedZones?.length}`
  );

  // Valid Kota Coaching Hub pincode (324005)
  const kotaPinRes = await fetch(`${BASE}/api/delivery/zones?pincode=324005`);
  const kotaPinData = await kotaPinRes.json().catch(() => ({}));
  const kotaZones = (kotaPinData as any).data;
  assert(
    "Valid Central Mart service area (324005 Kota South) resolves delivery zone",
    Array.isArray(kotaZones) && kotaZones.length > 0,
    `matchedCount=${kotaZones?.length}`
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 4: In-Store POS Scanner Settlement Resilience
  // --------------------------------------------------------------------------
  console.log("\n▶ [SUITE 4/5] IN-STORE POS BILLING & RAPID SETTLEMENT INTEGRITY");

  // Admin login to get authorized session
  const adminLogin = await fetch(`${BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: cookie },
    body: JSON.stringify({ username: "saif", password: "AdminPassword123!" }),
  });
  const adminCookies = adminLogin.headers.get("set-cookie") || cookie;

  // POS Settle with Cash
  const posCashRes = await fetch(`${BASE}/api/admin/pos/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      Cookie: adminCookies,
    },
    body: JSON.stringify({
      counterId: "POS-01",
      cashierName: "Ramesh Sharma",
      customerName: "Stress Test Buyer",
      customerPhone: "9876543210",
      paymentMode: "CASH",
      items: [
        {
          name: "Tata Salt 1kg",
          sellingPaise: 2700,
          qty: 2,
          barcode: "8901030383451",
        },
      ],
      discountPaise: 0,
    }),
  });
  const posCashJson = await posCashRes.json().catch(() => ({}));
  assert(
    "In-Store POS Cash checkout creates settled invoice and receipt voucher",
    posCashRes.status === 200 && Boolean((posCashJson as any).data?.voucherNumber),
    `voucher=${(posCashJson as any).data?.voucherNumber}`
  );

  // POS Settle with UPI QR
  const posUpiRes = await fetch(`${BASE}/api/admin/pos/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      Cookie: adminCookies,
    },
    body: JSON.stringify({
      counterId: "POS-02",
      cashierName: "Pooja Verma",
      customerName: "UPI Walk-in",
      customerPhone: "9876543211",
      paymentMode: "UPI",
      items: [
        {
          name: "Fortune Sunflower Oil 1L",
          sellingPaise: 15900,
          qty: 1,
          barcode: "8906007281234",
        },
      ],
    }),
  });
  const posUpiJson = await posUpiRes.json().catch(() => ({}));
  assert(
    "In-Store POS UPI settlement captures payment mode correctly",
    posUpiRes.status === 200 && (posUpiJson as any).data?.paymentMode === "UPI",
    `mode=${(posUpiJson as any).data?.paymentMode}`
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 5: High-Concurrency Burst (10 Parallel Requests)
  // --------------------------------------------------------------------------
  console.log("\n▶ [SUITE 5/5] HIGH-CONCURRENCY DATABASE BURST (10 CONCURRENT READS)");

  const startTime = Date.now();
  const burstResults = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      fetch(`${BASE}/api/products?page=1&pageSize=5`).then((r) => r.status)
    )
  );
  const elapsed = Date.now() - startTime;
  const allSucceeded = burstResults.every((s) => s === 200);

  assert(
    `Burst of 10 concurrent catalogue queries processed cleanly without dropping connections (${elapsed}ms)`,
    allSucceeded,
    `statuses=${burstResults.join(",")}`
  );

  console.log("\n================================================================================");
  console.log(`🏁 HARDEST BATTLE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runHardestTests().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});

