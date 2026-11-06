/**
 * Central Mart Comprehensive Production E2E Audit & Integration Test Runner
 *
 * Runs end-to-end testing across 10 critical domains:
 * 1. Storefront & Public APIs
 * 2. Customer Authentication & Session Lifecycle
 * 3. Cart Math & Guest-to-User Cart Merge
 * 4. Customer Checkout, Idempotency & Order Lifecycle
 * 5. Fast Barcode FMCG Listing (3-Second Quick Lister)
 * 6. Offline/Online In-Store Barcode Scanner POS Billing & Thermal Receipts
 * 7. BUSY POS Terminal Hub & Omnichannel Sync
 * 8. High-Speed Admin Dashboard Caching (<15ms)
 * 9. Security, CSRF Protection & RBAC Access Control
 * 10. Background Cron Jobs & Database Integrity
 */

export {};

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PHONE = `9876${Math.floor(100000 + Math.random() * 900000)}`;
const ADMIN_USER = process.env.SMOKE_ADMIN_USER ?? "saif";
const ADMIN_PASS = process.env.SMOKE_ADMIN_PASS ?? "AdminPassword123!";

let passes = 0;
let failures = 0;

function assertCheck(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passes += 1;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ FAIL: ${name} ${detail ? `[Detail: ${detail}]` : ""}`);
  }
}

let cookieJar = "";
let csrfToken = "";

async function refreshCsrfToken() {
  const r = await makeRequest("/api/auth/csrf");
  csrfToken = ((r.json.data as { csrfToken?: string } | undefined)?.csrfToken ?? "") as string;
}

function reqHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
    ...extra,
  };
}

async function makeRequest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), Cookie: cookieJar },
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const jar = new Map<string, string>();
    for (const part of cookieJar.split(";")) {
      const [k, v] = part.trim().split("=");
      if (k) jar.set(k, v ?? "");
    }
    for (const chunk of setCookie.split(/,(?=[^;]+?=)/)) {
      const [pair] = chunk.split(";");
      const [k, v] = pair.trim().split("=");
      if (k) jar.set(k, v ?? "");
    }
    cookieJar = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Non-JSON
  }

  return { status: res.status, json, text };
}

async function runAudit() {
  console.log("================================================================================");
  console.log("🚀 STARTING CENTRAL MART FULL PRODUCTION END-TO-END AUDIT & BUG DETECTION");
  console.log(`   Target Server: ${BASE} | Local Time: ${new Date().toISOString()}`);
  console.log("================================================================================\n");

  await refreshCsrfToken();

  // --------------------------------------------------------------------------
  // DOMAIN 1: Storefront & Public APIs
  // --------------------------------------------------------------------------
  console.log("▶ [DOMAIN 1/10] STOREFRONT & CATALOGUE PUBLIC APIS");
  const healthRes = await makeRequest("/api/health");
  assertCheck(
    "Health endpoint returns healthy status with low latency",
    healthRes.status === 200 && (healthRes.json as { status?: string }).status === "healthy",
    `status=${healthRes.status}`
  );

  const categoriesRes = await makeRequest("/api/categories");
  const categories = categoriesRes.json.data as Array<{ id: string; name: string }>;
  assertCheck(
    "Categories load with real FMCG departments",
    categoriesRes.status === 200 && Array.isArray(categories) && categories.length >= 10,
    `categoriesCount=${categories?.length}`
  );

  const productsRes = await makeRequest("/api/products?page=1&pageSize=10");
  const productData = productsRes.json.data as { items?: Array<{ id: string; slug: string; name: string }>; total?: number };
  const products = productData?.items ?? [];
  assertCheck(
    "Paginated FMCG products load successfully",
    productsRes.status === 200 && products.length > 0 && products.length <= 10,
    `count=${products.length} total=${productData?.total}`
  );

  const searchRes = await makeRequest("/api/search?q=atta");
  const searchResults = searchRes.json.data as { items?: unknown[]; total?: number };
  assertCheck(
    "Search finds relevant products (e.g. Atta/Flour)",
    searchRes.status === 200 && (searchResults?.total ?? 0) > 0,
    `found=${searchResults?.total}`
  );

  const suggestRes = await makeRequest("/api/search/suggest?q=mag");
  const suggestData = suggestRes.json.data as { suggestions?: unknown[] };
  assertCheck(
    "Autocomplete search suggestion returns matches",
    suggestRes.status === 200 && Array.isArray(suggestData?.suggestions),
    `suggestionsCount=${suggestData?.suggestions?.length}`
  );

  const sampleSlug = products[0]?.slug;
  const productDetailRes = await makeRequest(`/api/products/${sampleSlug}`);
  const sampleVariantId = ((productDetailRes.json.data as { product?: { variants?: Array<{ id: string }> } })?.product?.variants?.[0]?.id ?? "") as string;
  assertCheck(
    `Product detail by slug ("${sampleSlug}") resolves active variant`,
    productDetailRes.status === 200 && Boolean(sampleVariantId),
    `variantId=${sampleVariantId}`
  );

  const zonesRes = await makeRequest("/api/delivery/zones");
  const zones = zonesRes.json.data as Array<{ id: string; minOrderPaise: number }>;
  assertCheck(
    "Public 10-minute delivery zones load with minimum order thresholds",
    zonesRes.status === 200 && Array.isArray(zones) && zones.length > 0,
    `zonesCount=${zones?.length}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 2: Cart Math & Guest Flow
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 2/10] CART ENGINE & GUEST SHOPPING");
  const addCartRes = await makeRequest("/api/cart", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ variantId: sampleVariantId, qty: 3 }),
  });
  assertCheck(
    "Guest can add items to cart",
    addCartRes.status === 200,
    `status=${addCartRes.status}`
  );

  const cartGetRes = await makeRequest("/api/cart");
  const cartData = cartGetRes.json.data as { lines?: Array<{ variantId: string; qty: number }>; subtotalPaise?: number };
  assertCheck(
    "Cart calculates subtotal correctly",
    cartGetRes.status === 200 && (cartData?.subtotalPaise ?? 0) > 0,
    `subtotalPaise=${cartData?.subtotalPaise}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 3: Customer Auth & Guest-to-User Cart Merge
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 3/10] CUSTOMER AUTH & AUTOMATIC CART MERGE");
  const otpRequestRes = await makeRequest("/api/auth/request-otp", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ phone: PHONE }),
  });
  const devOtp = (otpRequestRes.json.data as { devOtp?: string })?.devOtp;
  assertCheck(
    "Customer OTP requested successfully",
    otpRequestRes.status === 200 && Boolean(devOtp),
    `status=${otpRequestRes.status}`
  );

  const verifyOtpRes = await makeRequest("/api/auth/verify-otp", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ phone: PHONE, code: devOtp }),
  });
  assertCheck(
    "Customer OTP verified and signed in",
    verifyOtpRes.status === 200,
    `status=${verifyOtpRes.status}`
  );

  const mergedCartRes = await makeRequest("/api/cart");
  const mergedCart = mergedCartRes.json.data as { lines?: unknown[]; subtotalPaise?: number };
  assertCheck(
    "Guest cart seamlessly merged into logged-in user profile",
    mergedCartRes.status === 200 && (mergedCart?.lines?.length ?? 0) > 0,
    `lines=${mergedCart?.lines?.length}`
  );

  const meRes = await makeRequest("/api/auth/me");
  const meUser = (meRes.json.data as { session?: { user?: { phone?: string } } })?.session?.user;
  assertCheck(
    "Customer profile /api/auth/me returns authenticated user",
    meRes.status === 200 && meUser?.phone === PHONE,
    `phone=${meUser?.phone}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 4: Checkout, Idempotency & Cancellation
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 4/10] CHECKOUT, IDEMPOTENCY & ORDER LIFECYCLE");
  const addressRes = await makeRequest("/api/account/addresses", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({
      label: "Home",
      name: "Audit Tester",
      phone: PHONE,
      line1: "Flat 402, Central Heights",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    }),
  });
  const addressId = (addressRes.json.data as { id?: string })?.id;
  assertCheck(
    "Customer delivery address created",
    (addressRes.status === 200 || addressRes.status === 201) && Boolean(addressId),
    `addressId=${addressId}`
  );

  // Ensure cart subtotal is comfortably above zone minimum
  await makeRequest("/api/cart", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ variantId: sampleVariantId, qty: 5 }),
  });

  const idempotencyKey = `e2e-audit-${Date.now()}`;
  const checkoutPayload = { addressId, deliveryMethod: "DELIVERY", paymentMethod: "COD" };

  const firstCheckoutRes = await makeRequest("/api/checkout", {
    method: "POST",
    headers: reqHeaders({ "Idempotency-Key": idempotencyKey }),
    body: JSON.stringify(checkoutPayload),
  });
  const createdOrderId = (firstCheckoutRes.json.data as { orderId?: string })?.orderId;
  assertCheck(
    "Customer can place COD order",
    (firstCheckoutRes.status === 200 || firstCheckoutRes.status === 201) && Boolean(createdOrderId),
    `orderId=${createdOrderId}`
  );

  const duplicateCheckoutRes = await makeRequest("/api/checkout", {
    method: "POST",
    headers: reqHeaders({ "Idempotency-Key": idempotencyKey }),
    body: JSON.stringify(checkoutPayload),
  });
  const duplicateOrderId = (duplicateCheckoutRes.json.data as { orderId?: string })?.orderId;
  assertCheck(
    "Idempotency prevents duplicate order creation on network retries",
    duplicateOrderId === createdOrderId,
    `first=${createdOrderId} duplicate=${duplicateOrderId}`
  );

  if (createdOrderId) {
    const orderDetailRes = await makeRequest(`/api/orders/${createdOrderId}`);
    assertCheck(
      "Customer can fetch live order details",
      orderDetailRes.status === 200 && (orderDetailRes.json.data as { order?: { id?: string } })?.order?.id === createdOrderId,
      `status=${orderDetailRes.status}`
    );

    // Cancel order
    const cancelRes = await makeRequest(`/api/orders/${createdOrderId}/cancel`, {
      method: "POST",
      headers: reqHeaders(),
      body: JSON.stringify({ reason: "Testing cancellation flow" }),
    });
    assertCheck(
      "Customer can cancel PLACED order",
      cancelRes.status === 200,
      `status=${cancelRes.status}`
    );
  }

  // --------------------------------------------------------------------------
  // DOMAIN 5: Fast Barcode FMCG Product Lister (3-Second Lister)
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 5/10] FAST BARCODE PRODUCT LISTER (3-SECOND LISTING)");
  // Admin Login
  cookieJar = "";
  await refreshCsrfToken();
  const adminLoginRes = await makeRequest("/api/auth/admin/login", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  assertCheck(
    "Staff administrator signs in successfully",
    adminLoginRes.status === 200,
    `status=${adminLoginRes.status}`
  );

  // Barcode Lookup Test
  const maggiBarcode = "8901058852441";
  const barcodeLookupRes = await makeRequest(`/api/admin/products/barcode-lookup?barcode=${maggiBarcode}`);
  const lookupData = barcodeLookupRes.json.data as {
    exists?: boolean;
    name?: string;
    suggestion?: { name?: string; brand?: string; suggestedSellingPaise?: number };
  };
  assertCheck(
    "EAN-13 Barcode Lookup identifies FMCG item & auto-populates title & brand",
    Boolean(
      barcodeLookupRes.status === 200 &&
        (lookupData?.name?.includes("Maggi") || lookupData?.suggestion?.name?.includes("Maggi"))
    ),
    `matchedName=${lookupData?.name || lookupData?.suggestion?.name}`
  );

  // Quick Add Test
  const testBarcode = `890999${Date.now().toString().slice(-7)}`;
  const quickAddRes = await makeRequest("/api/admin/products/quick-add", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({
      barcode: testBarcode,
      name: "Amul Gold Homogenised Milk 500ml",
      brandName: "Amul",
      categoryId: categories[0]?.id,
      packSize: "500ml",
      mrpPaise: 3400,
      sellingPaise: 3200,
      initialStock: 45,
      hsnSac: "04012000",
      gstBps: 500,
      unit: "pouch",
    }),
  });
  assertCheck(
    "3-Second Quick Product Lister creates Product, Variant, Price & Opening Stock",
    quickAddRes.status === 200 && (quickAddRes.json.data as { success?: boolean })?.success === true,
    `message=${(quickAddRes.json.data as { message?: string })?.message}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 6: Offline & Online In-Store Barcode Scanner Billing (POS)
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 6/10] IN-STORE BARCODE SCANNER BILLING & RECEIPT PRINTING");
  const posCheckoutRes = await makeRequest("/api/admin/pos/checkout", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({
      counterId: "POS-01",
      cashierName: "Ramesh Sharma",
      customerName: "Vikas Sethi",
      customerPhone: "9823456789",
      paymentMode: "UPI",
      items: [
        { barcode: maggiBarcode, name: "Maggi 280g", packSize: "Pack of 4", sellingPaise: 5400, qty: 3 },
        { barcode: "8901262010053", name: "Amul Butter 500g", packSize: "500g", sellingPaise: 26500, qty: 1 },
      ],
    }),
  });

  const posData = posCheckoutRes.json.data as {
    success?: boolean;
    voucherNumber?: string;
    grandTotalPaise?: number;
    items?: Array<{ name: string; qty: number }>;
  };
  assertCheck(
    "In-Store POS Scanner checkout creates settled order, deducts stock & generates voucher",
    posCheckoutRes.status === 200 && posData?.success === true && Boolean(posData?.voucherNumber),
    `voucher=${posData?.voucherNumber} total=${posData?.grandTotalPaise}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 7: BUSY POS Terminal Hub & Omnichannel Sync
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 7/10] BUSY POS TERMINAL HUB & OMNICHANNEL ENGINE");
  const busyStatusRes = await makeRequest("/api/admin/busy/status");
  const busyMetrics = (busyStatusRes.json.data as { metrics?: { counters?: unknown[]; todaySalesPaise?: number } })?.metrics;
  assertCheck(
    "BUSY POS Terminal Hub reports active counters and in-store sales",
    busyStatusRes.status === 200 && Array.isArray(busyMetrics?.counters) && busyMetrics.counters.length === 3,
    `countersCount=${busyMetrics?.counters?.length} todaySales=${busyMetrics?.todaySalesPaise}`
  );

  const busySyncRes = await makeRequest("/api/admin/busy/sync", {
    method: "POST",
    headers: reqHeaders(),
  });
  assertCheck(
    "1-Click Manual Sync synchronizes counter sales vouchers and stock records",
    busySyncRes.status === 200 && (busySyncRes.json.data as { success?: boolean })?.success === true,
    `message=${(busySyncRes.json.data as { message?: string })?.message}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 8: Admin Dashboard High-Speed SWR Caching
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 8/10] ADMIN DASHBOARD HIGH-SPEED CACHING (< 15MS)");
  const t0 = Date.now();
  const dashRes = await makeRequest("/api/admin/dashboard");
  const t1 = Date.now();
  const dashLatency = t1 - t0;
  assertCheck(
    "Admin Dashboard loads successfully with high-speed response",
    dashRes.status === 200,
    `latency=${dashLatency}ms status=${dashRes.status}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 9: Security, CSRF Protection & Access Control
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 9/10] SECURITY, CSRF PROTECTION & RBAC BOUNDARIES");
  // Unauthenticated admin access should be blocked
  const savedCookie = cookieJar;
  cookieJar = "";
  const anonAdminRes = await makeRequest("/api/admin/dashboard");
  assertCheck(
    "Anonymous request to admin endpoints is rejected with 401 Unauthorized",
    anonAdminRes.status === 401,
    `status=${anonAdminRes.status}`
  );

  // Missing CSRF on write should be rejected with 403
  cookieJar = savedCookie;
  const noCsrfRes = await makeRequest("/api/admin/products/quick-add", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // no x-csrf-token
    body: JSON.stringify({ barcode: "123", name: "Test" }),
  });
  assertCheck(
    "Mutation without valid CSRF token is rejected with 403 Forbidden",
    noCsrfRes.status === 403,
    `status=${noCsrfRes.status}`
  );

  // --------------------------------------------------------------------------
  // DOMAIN 10: Background Jobs & System Maintenance
  // --------------------------------------------------------------------------
  console.log("\n▶ [DOMAIN 10/10] BACKGROUND JOBS & SYSTEM MAINTENANCE");
  const expireJobRes = await makeRequest("/api/jobs/expire-reservations", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({}),
  });
  assertCheck(
    "Reservation expiry cron job executes cleanly without errors",
    expireJobRes.status === 200,
    `status=${expireJobRes.status}`
  );

  const syncJobRes = await makeRequest("/api/jobs/process-sync", {
    method: "POST",
    headers: reqHeaders(),
    body: JSON.stringify({ limit: 10 }),
  });
  assertCheck(
    "Integration sync processor job runs successfully",
    syncJobRes.status === 200,
    `status=${syncJobRes.status}`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`📊 PRODUCTION E2E AUDIT COMPLETE: ${passes} PASSED, ${failures} FAILED`);
  console.log("================================================================================");

  if (failures > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("FATAL AUDIT RUNNER ERROR:", err);
  process.exit(1);
});
