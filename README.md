# Grocery Commerce Platform

Production-grade grocery commerce for **one existing physical grocery store in India** (~5,000 SKUs, BUSY Enterprise in-store). Clean modular monolith — **not** microservices, **not** a generic SaaS dashboard.

**BUSY is NOT connected in v1.** The codebase is BUSY-ready (fields, adapter interface, sync engine, honest "Not Connected" status in the admin panel) but never fakes a connection. See `docs/busy-integration.md`.

## Stack

- Next.js 14 + TypeScript + React + Tailwind CSS (storefront + admin + API routes)
- PostgreSQL 16 + Prisma (type-safe ORM, migrations)
- Zod validation, JWT access (15 min) + rotating refresh tokens (7 days, hashed), httpOnly cookies, double-submit CSRF
- Redis-compatible cache layer (uses Redis when `REDIS_URL` is set, in-memory fallback otherwise)
- S3-compatible image storage (uses S3 when configured, local `./public/uploads` otherwise)
- Money is **always integer paise** — never floats. Prices are **tax-inclusive** (Indian MRP includes GST); the GST component is shown for display and is never added to the grand total.

## Quick start (local)

```bash
cp .env.example .env
# edit .env: DATABASE_URL, JWT secrets, ADMIN_USERNAME / ADMIN_PASSWORD (optional — see below)
npm install
npm run prisma:migrate   # applies migrations to DATABASE_URL
npm run seed             # demo catalogue, roles, zones, coupons, settings (+ admin user if env set)
npm run dev              # http://localhost:3000
```

Requires PostgreSQL 16 and (optionally) Redis running locally. Redis is optional — the app falls back to in-memory caching.

### First-run admin setup

If you did not set `ADMIN_USERNAME` / `ADMIN_PASSWORD` before seeding, create the first admin once:

```
POST /api/auth/setup  { "username": "owner", "password": "…" }
```

This endpoint only works when **zero** admin users exist. Staff login: `/staff-login`. Customers sign in with mobile + OTP (`/login`); in development, when `ALLOW_DEV_OTP=true` and `NODE_ENV != production`, the OTP is returned in the API response for testing. Never enable that in production.

## Demo data

`npm run seed` loads a realistic Indian grocery demo catalogue (Amul, Britannia, Tata Salt, Aashirvaad, Fortune, Surf Excel, Coca-Cola, Pepsi, Maggi, …) across 7 categories with independent per-variant inventory. It is **clearly demo data** (SKUs prefixed `DEMO-`) and is skipped on re-run. It does **not** create 5,000 products — the real catalogue loads via the admin **Bulk Import** CSV tool (preview → validate → import, every bad row reported with its line number, never silently ignored).

## Deploy

### Docker (recommended for VPS)

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run seed
```

See `docker-compose.yml`. The app container waits for Postgres to be healthy before starting.

### Plain VPS

1. Provision PostgreSQL 16 + Redis (optional) + Node 20+.
2. Set env vars from `.env.example` (use real secrets — never commit `.env`).
3. `npm install && npx prisma migrate deploy && npm run build && npm start`

Keep `NODE_ENV=production` in any deploy `.env` (`.env.example` ships it): a
development value breaks `npm run build` and leaves dev-only endpoints
enabled. `next dev` sets development automatically for local work.

Search uses PostgreSQL `pg_trgm` (migration `20261025113113_add_pg_trgm_search`)
for typo-tolerant fallback matching. If the deploy database user cannot
`CREATE EXTENSION`, have a superuser run `CREATE EXTENSION IF NOT EXISTS
pg_trgm;` once first; without the extension, search still works but the fuzzy
fallback degrades to no results instead of erroring.

### Vercel-style (serverless)

Works with an external Postgres (e.g. Neon/Supabase Postgres) and Redis (e.g. Upstash). Set `DATABASE_URL` + `REDIS_URL`; run `npx prisma migrate deploy` from CI before deploy. Local file uploads do **not** persist on serverless — configure S3 env vars (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`) so images go to object storage.

## Key design rules

- **Checkout is server-side only**: prices and inventory are re-validated inside one DB transaction with row locks; the frontend is never trusted.
- **Reservations**: stock is reserved at checkout, consumed at PACKED, released on payment failure / cancel / expiry (30 min, configurable). Sellable = available − reserved.
- **Idempotency**: `Idempotency-Key` header on checkout — double-tapping Place Order creates exactly one order. Webhooks are idempotent by event id.
- **Payments**: provider abstraction (`PaymentProvider`). COD / UPI / Online Gateway independently enable/disable in Settings. Client-side "payment success" is never trusted — only server-verified callbacks/webhooks confirm an order. The mock gateway (`/checkout/mock-pay`, `/api/payments/mock-confirm`) is **dev-only** and forbidden in production.
- **Orders**: strict state machine (PENDING_PAYMENT → PLACED → CONFIRMED → PREPARING → PACKED → OUT_FOR_DELIVERY → DELIVERED, plus PAYMENT_FAILED / CANCELLED / REFUND_PENDING / REFUNDED). Every change lands in `order_status_history`.
- **RBAC**: OWNER / MANAGER / ORDER_STAFF / INVENTORY_STAFF / DELIVERY_STAFF, enforced on the server in every admin route — never just hidden buttons.
- **Loyalty & store credit are ledgers**: the account total is a cached sum; transactions are the source of truth.
- **Audit logs**: price, stock, refund, credit, cancel, permission, settings and integration changes record actor / action / entity / before / after / timestamp / IP.
- **Notifications**: provider abstraction (SMS / WhatsApp / Email / Push). v1 ships a console provider (logged, not sent) — wire a real provider behind the interface; never couple to one vendor.
- **Delivery v1 is store-handled**: zones, PIN codes, charges, free thresholds, slots and ETAs are admin-managed. Shiprocket is a future adapter only — no credentials, no calls.

## PWA (installable app)

The storefront is a full PWA: `public/manifest.webmanifest`, service worker (`public/sw.js`, app-shell + image caching, offline fallback at `/offline`), a top **Download App** banner with the real install flow (native prompt on Android/Chrome, Share → Add to Home Screen guidance on iOS), and banner dismissal/install detection (hides in standalone mode). No fake Play Store / App Store badges — there are no native store listings in v1.

## Branded loading

Cold loads show the store's own wordmark/monogram on the brand background (never a blank screen or bare spinner), route changes show skeleton screens, and `prefers-reduced-motion` is respected (static logo, no animation). The PWA splash (manifest background + icon) matches the web loader.

## Tests

```bash
npm test     # vitest unit tests: money, pricing, inventory math, order state machine
npm run smoke  # end-to-end API smoke: browse → cart → checkout → fulfilment → cancel/refund,
               # role checks, reservation expiry, idempotency, webhook handling
```

Smoke needs the dev server running and `ALLOW_DEV_OTP=true`. Admin checks in smoke need `SMOKE_ADMIN_USER` / `SMOKE_ADMIN_PASS` (the seeded admin); without them those checks are skipped, not faked.

## Environment variables

See `.env.example` — every variable is documented there. Secrets live **only** in env; no secret appears in code, the repo, or the frontend bundle.

## Project layout

```
prisma/            schema + migrations + seed
src/lib/           domain services: pricing, inventory, orders, payments, coupons,
                   loyalty, credit, busy (mock adapter + sync engine), shiprocket,
                   notify, storage, cache, auth, rbac, audit, settings, search, cart
src/app/           storefront pages + admin panel + API routes
src/components/    storefront + admin UI
public/            manifest, service worker, icons, offline page assets
tests/             unit tests + API smoke script
docs/              BUSY integration design
```
