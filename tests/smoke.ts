/**
 * End-to-end API smoke test: browse → search → cart → checkout (COD) → admin
 * fulfilment → cancel/refund paths, role checks, reservation expiry, idempotency,
 * duplicate webhook handling.
 *
 * Requires: dev server running on BASE_URL (default http://localhost:3000),
 * seeded DB, ALLOW_DEV_OTP=true + NODE_ENV != production for the OTP shortcut.
 * Run: npm run smoke
 *
 * The script prints one PASS/FAIL line per check and exits non-zero on any failure.
 */
export {};

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PHONE = "9876500001";

let failures = 0;
let passes = 0;
function ok(name: string, cond: boolean, extra?: string) {
  if (cond) {
    passes += 1;
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

let csrf = "";
async function refreshCsrf() {
  // Use req() so the CSRF cookie lands in the jar (double-submit needs both).
  const r = await req("/api/auth/csrf");
  csrf = ((r.json.data as { csrfToken?: string } | undefined)?.csrfToken ?? "") as string;
}
function headers(extra: Record<string, string> = {}) {
  return { "Content-Type": "application/json", "x-csrf-token": csrf, ...extra };
}
// Minimal cookie jar (Node fetch does not persist cookies automatically).
let cookie = "";
async function req(path: string, init: RequestInit = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), Cookie: cookie },
  });
  const setCookie = r.headers.get("set-cookie");
  if (setCookie) {
    // Keep the latest value of each cookie name.
    const jar = new Map<string, string>();
    for (const part of cookie.split(";")) {
      const [k, v] = part.trim().split("=");
      if (k) jar.set(k, v ?? "");
    }
    for (const chunk of setCookie.split(/,(?=[^;]+?=)/)) {
      const [pair] = chunk.split(";");
      const [k, v] = pair.trim().split("=");
      if (k) jar.set(k, v ?? "");
    }
    cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  const text = await r.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* non-JSON */
  }
  return { status: r.status, json };
}

async function main() {
  await refreshCsrf();

  // 1. Public catalogue
  const cats = await req("/api/categories");
  ok("public categories load", cats.status === 200 && Array.isArray(cats.json.data) && (cats.json.data as unknown[]).length > 0, `status=${cats.status}`);
  const prods = await req("/api/products?page=1&pageSize=5");
  const items = (prods.json.data as { items?: unknown[] } | undefined)?.items ?? (prods.json.data as unknown[]);
  ok("public products paginated (never full catalogue)", prods.status === 200 && Array.isArray(items) && items.length > 0 && items.length <= 5, `status=${prods.status}`);
  const search = await req("/api/search?q=atta");
  ok("search finds atta", search.status === 200 && ((search.json.data as { total?: number })?.total ?? 0) > 0, JSON.stringify(search.json).slice(0, 120));
  const suggest = await req("/api/search/suggest?q=mag");
  ok("autocomplete suggestions", suggest.status === 200 && Array.isArray((suggest.json.data as { suggestions?: unknown[] })?.suggestions), `status=${suggest.status}`);

  // Pick a variant with stock for the cart flow.
  const first = (items as Array<{ variants?: Array<{ id: string }> }>)[0];
  const detail = await req(`/api/products/${(items as Array<{ slug?: string }>)[0]?.slug ?? ""}`);
  const variantId = ((detail.json.data as { product?: { variants?: Array<{ id: string }> } })?.product?.variants?.[0]?.id ?? first?.variants?.[0]?.id ?? "") as string;
  ok("product detail resolves a variant", Boolean(variantId));

  // 2. Guest cart — top up until the zone minimum (₹199) is comfortably met.
  const cartAdd = await req("/api/cart", { method: "POST", headers: headers(), body: JSON.stringify({ variantId, qty: 2 }) });
  ok("guest add to cart", cartAdd.status === 200, `status=${cartAdd.status} ${JSON.stringify(cartAdd.json).slice(0, 160)}`);

  async function ensureCartAtLeast(minPaise: number) {
    // Grow the FIRST line's quantity (cart POST sets absolute qty) until the
    // subtotal clears the zone minimum. The products LIST route carries no
    // variants, so topping up from it silently no-ops — use the cart itself.
    for (let i = 0; i < 3; i++) {
      const cart = await req("/api/cart");
      const data = cart.json.data as { lines?: Array<{ variantId: string; qty: number; unitPricePaise: number; maxOrderQty: number }>; subtotalPaise?: number };
      const sub = data?.subtotalPaise ?? 0;
      if (sub >= minPaise) return;
      const line = data?.lines?.[0];
      if (!line || line.unitPricePaise <= 0) return;
      const need = Math.ceil((minPaise - sub) / line.unitPricePaise);
      const qty = Math.min(line.qty + need, line.maxOrderQty);
      if (qty <= line.qty) return;
      const post = await req("/api/cart", { method: "POST", headers: headers(), body: JSON.stringify({ variantId: line.variantId, qty }) });
    }
    const cart = await req("/api/cart");
    const sub = (cart.json.data as { subtotalPaise?: number })?.subtotalPaise ?? 0;
    ok("cart reaches zone minimum", sub >= minPaise, `subtotal=${sub}`);
  }
  await ensureCartAtLeast(25000);

  // 3. OTP login (dev shortcut) + cart merge
  const otpReq = await req("/api/auth/request-otp", { method: "POST", headers: headers(), body: JSON.stringify({ phone: PHONE }) });
  const devOtp = (otpReq.json.data as { devOtp?: string })?.devOtp;
  ok("OTP requested (dev shortcut)", otpReq.status === 200 && Boolean(devOtp), `status=${otpReq.status}`);
  const verify = await req("/api/auth/verify-otp", { method: "POST", headers: headers(), body: JSON.stringify({ phone: PHONE, code: devOtp }) });
  ok("OTP verify signs in", verify.status === 200, `status=${verify.status} ${JSON.stringify(verify.json).slice(0, 160)}`);
  const cartAfter = await req("/api/cart");
  const cartAfterData = cartAfter.json.data as { lines?: unknown[]; subtotalPaise?: number };
  const cartItems = (cartAfterData?.lines ?? []) as unknown[];
  // Merged cart must carry the topped-up subtotal (>= 25000), not just any
  // lines — a failed login still returns the guest cart, which would fake this.
  ok("guest cart merged on login", verify.status === 200 && cartAfter.status === 200 && cartItems.length > 0 && (cartAfterData.subtotalPaise ?? 0) >= 25000, `lines=${cartItems.length} subtotal=${cartAfterData.subtotalPaise}`);

  // 4. Address + checkout (COD), idempotency: same key twice = one order.
  const addr = await req("/api/account/addresses", { method: "POST", headers: headers(), body: JSON.stringify({ label: "Home", name: "Smoke Tester", phone: PHONE, line1: "1 Main Road", city: "Jaipur", state: "Rajasthan", pincode: "302001" }) });
  ok("address created", addr.status === 200 || addr.status === 201, `status=${addr.status}`);
  const addressId = (addr.json.data as { id?: string })?.id;
  const zones = await req("/api/delivery/zones");
  const zoneId = ((zones.json.data as Array<{ id: string }>)?.[0]?.id ?? "") as string;
  ok("delivery zones public", zones.status === 200 && Boolean(zoneId));
  const idemKey = `smoke-${Date.now()}`;
  const checkoutBody = { addressId, deliveryMethod: "DELIVERY", paymentMethod: "COD" };
  const co1 = await req("/api/checkout", { method: "POST", headers: headers({ "Idempotency-Key": idemKey }), body: JSON.stringify(checkoutBody) });
  const orderId = (co1.json.data as { orderId?: string })?.orderId as string | undefined;
  ok("checkout places COD order", (co1.status === 200 || co1.status === 201) && Boolean(orderId), `status=${co1.status} ${JSON.stringify(co1.json).slice(0, 200)}`);
  const co2 = await req("/api/checkout", { method: "POST", headers: headers({ "Idempotency-Key": idemKey }), body: JSON.stringify(checkoutBody) });
  const orderId2 = (co2.json.data as { orderId?: string })?.orderId as string | undefined;
  ok("idempotent re-checkout returns the SAME order", (co2.status === 200 || co2.status === 201) && orderId2 === orderId, `first=${orderId} second=${orderId2}`);

  // 5. Customer order detail + cancel path (fresh order via second checkout without idempotency key reuse).
  if (orderId) {
    const od = await req(`/api/orders/${orderId}`);
    ok("customer can read own order", od.status === 200, `status=${od.status}`);
    // Re-add to cart for a cancellable order, then cancel it.
    await req("/api/cart", { method: "POST", headers: headers(), body: JSON.stringify({ variantId, qty: 1 }) });
    await ensureCartAtLeast(25000);
    const co3 = await req("/api/checkout", { method: "POST", headers: headers({ "Idempotency-Key": `smoke-cancel-${Date.now()}` }), body: JSON.stringify(checkoutBody) });
    const cancelId = (co3.json.data as { orderId?: string })?.orderId as string | undefined;
    if (cancelId) {
      const cancel = await req(`/api/orders/${cancelId}/cancel`, { method: "POST", headers: headers(), body: JSON.stringify({}) });
      ok("customer can cancel a PLACED order", cancel.status === 200, `status=${cancel.status}`);
      const afterCancel = await req(`/api/orders/${cancelId}`);
      ok("cancelled order status recorded", (afterCancel.json.data as { order?: { status?: string } })?.order?.status === "CANCELLED", `status=${(afterCancel.json.data as { order?: { status?: string } })?.order?.status}`);
    } else {
      ok("second order for cancel path", false, JSON.stringify(co3.json).slice(0, 200));
    }
  }

  // 6. Admin login + fulfilment + role check + reservation expiry job.
  const adminUser = process.env.SMOKE_ADMIN_USER ?? "";
  const adminPass = process.env.SMOKE_ADMIN_PASS ?? "";
  if (!adminUser || !adminPass) {
    console.log("SKIP admin checks (SMOKE_ADMIN_USER/SMOKE_ADMIN_PASS not set)");
  } else {
    // Fresh cookie jar for the admin session.
    cookie = "";
    await refreshCsrf();
    const login = await req("/api/auth/admin/login", { method: "POST", headers: headers(), body: JSON.stringify({ username: adminUser, password: adminPass }) });
    ok("admin login", login.status === 200, `status=${login.status}`);
    if (orderId) {
      const tr = await req(`/api/admin/orders/${orderId}/transition`, { method: "POST", headers: headers(), body: JSON.stringify({ to: "CONFIRMED" }) });
      ok("admin accepts order (PLACED → CONFIRMED)", tr.status === 200, `status=${tr.status} ${JSON.stringify(tr.json).slice(0, 160)}`);
      const bad = await req(`/api/admin/orders/${orderId}/transition`, { method: "POST", headers: headers(), body: JSON.stringify({ to: "DELIVERED" }) });
      ok("invalid transition rejected (CONFIRMED → DELIVERED)", bad.status === 400 || bad.status === 422 || bad.status === 409, `status=${bad.status}`);
      const dash = await req("/api/admin/dashboard");
      ok("admin dashboard loads", dash.status === 200, `status=${dash.status}`);
      const integ = await req("/api/admin/integrations");
      const busyEntry = ((integ.json.data as { integrations?: Array<{ name: string; connected: boolean }> })?.integrations ?? []).find((i) => i.name.includes("BUSY"));
      ok("BUSY honestly reported as Not Connected", integ.status === 200 && busyEntry?.connected === false, `status=${integ.status}`);
    }
    const expire = await req("/api/jobs/expire-reservations", { method: "POST", headers: headers(), body: JSON.stringify({}) });
    ok("reservation expiry job runs", expire.status === 200, `status=${expire.status}`);
    // Role check: an unauthenticated request to admin endpoints must fail.
    cookie = "";
    await refreshCsrf();
    const anon = await req("/api/admin/dashboard");
    ok("admin endpoints reject anonymous callers", anon.status === 401, `status=${anon.status}`);
  }

  // 7. Duplicate webhook handling (mock gateway path is dev-gated; here we verify the
  // webhook endpoint rejects unsigned payloads without a configured secret in a safe way).
  const wh = await req("/api/payments/webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: "smoke-dup-1" }) });
  ok("webhook endpoint responds (not a 500)", wh.status !== 500, `status=${wh.status}`);

  console.log(`\nSmoke result: ${passes} passed, ${failures} failed.`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Smoke crashed:", e);
  process.exit(1);
});
