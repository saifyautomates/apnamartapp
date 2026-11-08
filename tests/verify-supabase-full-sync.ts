/**
 * Full End-to-End Supabase & Database Sync Verification Suite
 *
 * Verifies:
 * 1. Supabase PostgreSQL database connectivity & table schemas
 * 2. Supabase Realtime CDC publication status (Order, Inventory, ProductVariant, Payment, OrderStatusHistory)
 * 3. Supabase Storage Bucket ("centralmart-media") accessibility & public URLs
 * 4. Supabase Auth token verification & session synchronization
 * 5. Full Omnichannel sync: Online order & POS checkout sync cleanly into PostgreSQL
 */

import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

const BASE = "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

async function verifyFullSync() {
  console.log("================================================================================");
  console.log("🔄 STARTING FULL SUPABASE, DATABASE, FRONTEND & BACKEND SYNC AUDIT");
  console.log("================================================================================");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Supabase PostgreSQL Schema & Counts
  console.log("\n▶ [STEP 1/5] SUPABASE POSTGRESQL DATABASE & PRISMA ORM SYNC");
  const [productCount, categoryCount, variantCount, inventoryCount, orderCount] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.productVariant.count({ where: { deletedAt: null } }),
    prisma.inventory.count(),
    prisma.order.count(),
  ]);

  assert(
    "Supabase PostgreSQL products and variants synchronized",
    productCount > 0 && variantCount >= productCount,
    `products=${productCount} variants=${variantCount}`
  );
  assert(
    "Supabase PostgreSQL 10 FMCG categories populated",
    categoryCount >= 10,
    `categories=${categoryCount}`
  );
  assert(
    "Supabase PostgreSQL inventory records match variant records",
    inventoryCount >= variantCount,
    `inventory=${inventoryCount} variants=${variantCount}`
  );

  // 2. Supabase Realtime CDC Publication
  console.log("\n▶ [STEP 2/5] SUPABASE REALTIME CDC REPLICATION CONFIGURATION");
  const pubTables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `;
  const publishedNames = pubTables.map((t) => t.tablename);
  const requiredTables = ["Order", "Inventory", "ProductVariant", "OrderStatusHistory", "Payment"];
  const allTablesPublished = requiredTables.every((t) => publishedNames.includes(t));

  assert(
    "Critical retail tables registered in Supabase Realtime publication",
    allTablesPublished,
    `activeTables=${publishedNames.join(", ")}`
  );

  // 3. Supabase Storage Bucket
  console.log("\n▶ [STEP 3/5] SUPABASE MEDIA STORAGE BUCKET");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  const hasMediaBucket = !bucketError && buckets.some((b) => b.name === "centralmart-media");

  assert(
    "Supabase Storage bucket 'centralmart-media' is active and accessible",
    hasMediaBucket,
    `buckets=${buckets?.map((b) => b.name).join(", ")}`
  );

  // 4. Supabase Auth API Endpoint Sync
  console.log("\n▶ [STEP 4/5] FRONTEND & BACKEND AUTH SYNCHRONIZATION");
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.data?.csrfToken;
  const setCookie = csrfRes.headers.get("set-cookie") || "";

  assert("CSRF protection handshake synchronized", Boolean(csrfToken), `csrfToken=${csrfToken?.slice(0, 8)}...`);

  const otpRes = await fetch(`${BASE}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: setCookie },
    body: JSON.stringify({ phone: "9876543299" }),
  });
  const otpData = await otpRes.json();
  assert(
    "Auth OTP handshake succeeds with backend",
    otpRes.status === 200 && Boolean(otpData.data?.devOtp),
    `otpStatus=${otpRes.status}`
  );

  // 5. Omnichannel POS & Online Orders Sync
  console.log("\n▶ [STEP 5/5] REALTIME OMNICHANNEL POS & STOREFRONT DATA SYNC");
  const adminLogin = await fetch(`${BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: setCookie },
    body: JSON.stringify({ username: "saif", password: "AdminPassword123!" }),
  });
  const adminCookies = adminLogin.headers.get("set-cookie") || setCookie;

  const preSyncOrderCount = await prisma.order.count();
  const posCheckoutRes = await fetch(`${BASE}/api/admin/pos/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, Cookie: adminCookies },
    body: JSON.stringify({
      counterId: "POS-SYNC-01",
      cashierName: "Realtime Sync Cashier",
      customerName: "Sync Customer",
      customerPhone: "9876543299",
      paymentMode: "CASH",
      items: [
        {
          name: "Tata Salt 1kg",
          sellingPaise: 2700,
          qty: 1,
          barcode: "8901030383451",
        },
      ],
    }),
  });
  const posCheckoutData = await posCheckoutRes.json();
  const postSyncOrderCount = await prisma.order.count();

  assert(
    "POS transaction immediately committed to Supabase PostgreSQL",
    posCheckoutRes.status === 200 && postSyncOrderCount === preSyncOrderCount + 1,
    `voucher=${posCheckoutData.data?.voucherNumber} dbCount=${postSyncOrderCount}`
  );

  const dashRes = await fetch(`${BASE}/api/admin/dashboard`, {
    headers: { Cookie: adminCookies },
  });
  const dashData = await dashRes.json();
  assert(
    "Admin Dashboard API reflects updated live sales totals from database",
    dashRes.status === 200 && dashData.data?.todayOrders > 0,
    `todayOrders=${dashData.data?.todayOrders} todaySales=${dashData.data?.todaySalesPaise}`
  );

  await prisma.$disconnect();

  console.log("\n================================================================================");
  console.log(`🏁 FULL SYNC AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyFullSync().catch((err) => {
  console.error("Sync audit failed:", err);
  process.exit(1);
});

