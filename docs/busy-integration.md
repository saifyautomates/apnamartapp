# BUSY Integration Design (v1: NOT connected)

> **Honest status: BUSY Enterprise is NOT connected in version 1.** Nothing in this document describes a live connection. The admin Integrations page shows **"BUSY Integration — Status: Not Connected"**, and the `MockBusyAdapter` returns `NOT_CONNECTED` for every operation instead of pretending to succeed. This document is the design that a future adapter implements.

## Why BUSY matters

The store already runs BUSY Enterprise in-store. BUSY is the system of record for stock and accounting. The online store must not become a second, diverging system of record — it must sync with BUSY in a way that survives BUSY being offline, slow, or temporarily unreachable.

## Architecture

```
Commerce domain (orders, cart, pricing, inventory)
        │
        ▼
Integration layer (src/lib/busy.ts)
        │
        ├── BusyAdapter interface (getProducts, getInventory, getCustomers, getPrices,
        │   createCustomer, createOrder, createInvoice, updateInventory,
        │   syncProduct, syncCustomer, syncOrder)
        │
        └── Implementations:
            ├── MockBusyAdapter (v1 — every method returns NOT_CONNECTED)
            └── RealBusyAdapter (future — BUSY API / file bridge / middleware)
```

Business logic never imports BUSY directly. It only talks to the adapter interface and the sync-job engine. **Checkout never blocks on BUSY**: if BUSY is down, the order still completes and an outbound sync job is queued for retry.

## Source-of-truth rules

| Domain | Source of truth | Notes |
|---|---|---|
| Inventory quantities | **BUSY** | In-store sales, purchase entries and stock adjustments originate in BUSY. Commerce stock is a synced copy. |
| Accounting / ledgers / GST returns | **BUSY** | Online orders become BUSY vouchers/invoices; BUSY remains the books. |
| Offline (counter) invoices | **BUSY** | Counter billing never goes through commerce. |
| Online order workflow (status, fulfilment) | **Commerce** | Placed → confirmed → packed → delivered lives here; BUSY only receives the resulting voucher/invoice. |
| Product content (names, images, descriptions) | **Commerce** | BUSY item masters are often terse; the storefront copy is curated here. |
| Pricing | **Configurable** | Admin setting `pricingSource`: `SOURCE` (BUSY price flows in) or `CUSTOM` (online price overrides). Per-variant `priceSource` already implements this. |

## Product / customer / order mapping

- Product: `internal_id`, `sku`, `barcode`, `external_source`, `external_item_id`, `busy_item_id`, `sync_enabled`, `last_synced_at`, `sync_status` (all present in the schema today).
- Customer: `busy_customer_id` on the user record.
- Order: `busy_voucher_id`, `busy_invoice_id`, `busy_sync_status` on the order.
- Generic: `integration_mappings` (`provider`, `entity_type`, `internal_entity_id`, `external_entity_id`) covers anything not modelled explicitly.

## BUSY posting trigger (configurable now)

Setting `busy.postingTrigger` (admin Settings page) chooses when an online order is posted to BUSY:

- `ORDER_CONFIRMED` — as soon as staff accept the order
- `PACKED` — when picking/packing finishes
- `OUT_FOR_DELIVERY` — **default**; the goods have left the store, so the sale is real
- `DELIVERED` — only after the customer receives it

The trigger is stored today; the posting itself happens only once a real adapter exists.

## Sync engine (implemented, adapter-independent)

Job types: `INBOUND_PRODUCT_SYNC`, `INBOUND_STOCK_SYNC`, `INBOUND_PRICE_SYNC`, `INBOUND_CUSTOMER_SYNC`, `OUTBOUND_CUSTOMER_SYNC`, `OUTBOUND_ORDER_SYNC`, `OUTBOUND_INVOICE_SYNC`.

Job tracking (`integration_sync_jobs`): provider, entity type/id, direction, status, attempts, last/next attempt, error, payload. Statuses: `PENDING → PROCESSING → SUCCESS | FAILED | RETRYING → DEAD` (dead-letter after 5 attempts, exponential backoff capped at 24h). Every attempt writes an `integration_sync_logs` row.

Trigger points (wired to the job queue, not to BUSY directly):

- Order reaches the posting trigger → enqueue `OUTBOUND_ORDER_SYNC` (+ `OUTBOUND_INVOICE_SYNC` when invoiced).
- New customer / address change → enqueue `OUTBOUND_CUSTOMER_SYNC`.
- Nightly (or on demand) → `INBOUND_STOCK_SYNC` / `INBOUND_PRICE_SYNC` to refresh commerce stock and prices from BUSY.

Run pending jobs: `POST /api/jobs/process-sync` (admin, `integrations:write`). Enqueue a test job: `POST /api/admin/integrations/sync`.

## Conflict strategy (never silently overwrite)

When an inbound sync disagrees with commerce data:

1. **Stock**: BUSY wins for quantities (it is the source of truth), but commerce reservations are never wiped — sellable is recomputed as `BUSY available − commerce reserved`. If BUSY available < reserved, the difference is flagged for manual reconciliation and the affected variants are surfaced in the admin Inventory page (low-stock warnings), not silently zeroed.
2. **Price**: honoured only when the pricing source is `SOURCE`. When `CUSTOM`, inbound prices are logged and ignored.
3. **Product master**: BUSY item creation/rename updates commerce fields only for fields the admin has mapped as BUSY-owned; commerce-curated content (images, descriptions) is never overwritten.
4. **Orders**: commerce is the workflow owner. A BUSY voucher id is recorded on the order once posted; a failed post retries via the job queue and never changes the customer's order status.
5. Every conflict writes a `FAILED` job + log row and appears in the admin Integrations page for manual reconciliation. Nothing is silently overwritten, nothing is silently dropped.

## Failure scenarios (explicit)

| Scenario | Behaviour |
|---|---|
| BUSY down during checkout | Order completes normally; outbound sync job queued, retried with backoff. Customer sees no error. |
| BUSY down during inbound stock sync | Job retries; commerce keeps serving last-known stock. No oversell risk added (reservations still enforced). |
| Sync job fails 5 times | Marked `DEAD` (dead-letter), surfaced in admin; staff reconcile manually. |
| Duplicate BUSY voucher | Idempotency via `integration_mappings` + order `busy_voucher_id`: a second post for the same order is a no-op. |
| BUSY returns partial data | Job fails with the provider error recorded; no partial write is applied (per-entity transactions). |

## What wiring a real adapter needs (future work)

1. How BUSY exposes data at this store: BUSY API, database access, or file export/import bridge (most single-store BUSY setups use a scheduled export or a small middleware service).
2. Credentials/endpoint for that bridge (env vars only, never in code).
3. Item-master mapping pass: match BUSY items to commerce SKUs/barcodes (the `busy_item_id` fields are ready).
4. A backfill run: inbound product + stock + price sync, then enable the posting trigger.
5. Monitoring: the Integrations page + job logs are the ops surface; add alerting on `DEAD` jobs before go-live.

## Shiprocket (same pattern, also not connected)

`DeliveryProvider` interface + `LocalDeliveryProvider` (store-handled, v1) + `NotConfiguredShiprocketAdapter` (returns not-configured). When the store wants courier shipping, implement the adapter — the checkout and order flows do not change.
