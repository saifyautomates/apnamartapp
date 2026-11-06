"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/shop";
import { useRouter } from "next/navigation";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-line px-3 py-2 text-sm";

export function useAdminForm<T>(path: string, method: "POST" | "PATCH" | "PUT" = "POST") {
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(body: T) {
    setBusy(true);
    setError("");
    setDone("");
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setDone("Saved.");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { submit, error, done, busy };
}

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next: Array<{ to: string; label: string }> = [];
  if (status === "PLACED") next.push({ to: "CONFIRMED", label: "Accept" });
  if (status === "CONFIRMED") next.push({ to: "PREPARING", label: "Start preparing" });
  if (status === "PREPARING") next.push({ to: "PACKED", label: "Mark packed" });
  if (status === "PACKED") next.push({ to: "OUT_FOR_DELIVERY", label: "Out for delivery" });
  if (status === "OUT_FOR_DELIVERY") next.push({ to: "DELIVERED", label: "Mark delivered" });

  async function transition(to: string) {
    if (to === "CANCELLED" && !window.confirm("Cancel this order? Stock will be released.")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/orders/${orderId}/transition`, { method: "POST", body: JSON.stringify({ to }) });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((n) => (
        <button key={n.to} onClick={() => transition(n.to)} disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {n.label}
        </button>
      ))}
      {["PLACED", "CONFIRMED", "PREPARING", "PACKED"].includes(status) ? (
        <button onClick={() => transition("CANCELLED")} disabled={busy} className="rounded-lg border border-sale bg-white px-4 py-2 text-sm font-semibold text-sale disabled:opacity-50">
          Cancel order
        </button>
      ) : null}
      {error ? <p className="w-full text-sm text-sale">{error}</p> : null}
    </div>
  );
}

export function RefundForm({ orderId }: { orderId: string }) {
  const [amountRupees, setAmountRupees] = useState("");
  const [reason, setReason] = useState("Customer return");
  const { submit, error, done, busy } = useAdminForm(`/api/admin/orders/${orderId}/refund`);
  return (
    <form
      className="space-y-2 rounded-xl border border-adminline bg-white p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ amountPaise: Math.round(parseFloat(amountRupees || "0") * 100), reason });
      }}
    >
      <h3 className="font-bold">Issue refund</h3>
      <Field label="Amount (₹)">
        <input className={inputCls} type="number" min={0} step="0.01" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} required />
      </Field>
      <Field label="Reason">
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required />
      </Field>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Processing…" : "Issue refund"}
      </button>
      {error ? <p className="text-sm text-sale">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700">{done}</p> : null}
    </form>
  );
}

export function ProductForm() {
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", categoryId: "", brandId: "", description: "", mrpPaise: 0, sellingPaise: 0, gstBps: 500, packSize: "", variantName: "Standard" });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const { submit, error, done, busy } = useAdminForm("/api/admin/products");
  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((j) => setCategories(j.data ?? [])).catch(() => undefined);
  }, []);
  const set = (k: string, v: string | number) => setForm({ ...form, [k]: v });
  return (
    <form
      className="grid gap-3 rounded-xl border border-adminline bg-white p-4 shadow-sm sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          name: form.name,
          sku: form.sku,
          barcode: form.barcode || undefined,
          brandId: form.brandId || undefined,
          categoryId: form.categoryId,
          description: form.description || undefined,
          gstBps: form.gstBps,
          variants: [{
            name: form.variantName || "Standard",
            sku: form.sku,
            mrpPaise: Math.round(Number(form.mrpPaise) * 100),
            sellingPaise: Math.round(Number(form.sellingPaise) * 100),
            packSize: form.packSize || undefined,
          }],
        });
      }}
    >
      <Field label="Product name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="SKU"><input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} required /></Field>
      <Field label="Category">
        <select className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
          <option value="">Select…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Barcode (optional)"><input className={inputCls} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
      <Field label="MRP (₹)"><input className={inputCls} type="number" step="0.01" min={0} value={form.mrpPaise} onChange={(e) => set("mrpPaise", e.target.value)} required /></Field>
      <Field label="Selling price (₹)"><input className={inputCls} type="number" step="0.01" min={0} value={form.sellingPaise} onChange={(e) => set("sellingPaise", e.target.value)} required /></Field>
      <Field label="GST (%)"><input className={inputCls} type="number" step="0.5" min={0} value={form.gstBps / 100} onChange={(e) => set("gstBps", Math.round(Number(e.target.value) * 100))} /></Field>
      <Field label="Pack size (e.g. 1 kg, 500 g)"><input className={inputCls} value={form.packSize} onChange={(e) => set("packSize", e.target.value)} /></Field>
      <Field label="Description"><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <p className="text-xs text-muted sm:col-span-2">Opening stock is set from the Inventory page after creating the product.</p>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
        {busy ? "Saving…" : "Create product"}
      </button>
      {error ? <p className="text-sm text-sale sm:col-span-2">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700 sm:col-span-2">{done}</p> : null}
    </form>
  );
}

export function CategoryForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { submit, error, done, busy } = useAdminForm("/api/admin/categories");
  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl border border-adminline bg-white p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ name, description: description || undefined });
        setName("");
        setDescription("");
      }}
    >
      <label className="text-sm font-medium">Name <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="text-sm font-medium">Description <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add category</button>
      {error ? <p className="w-full text-sm text-sale">{error}</p> : null}
      {done ? <p className="w-full text-sm text-brand-700">{done}</p> : null}
    </form>
  );
}

export function InventoryAdjustForm({ variantId }: { variantId: string }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("Manual adjustment");
  const [kind, setKind] = useState<"ADJUST" | "RECEIVE">("ADJUST");
  const { submit, error, done, busy } = useAdminForm("/api/admin/inventory/adjust");
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ variantId, delta, reason, kind });
      }}
    >
      <label className="text-sm font-medium">Type
        <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as "ADJUST" | "RECEIVE")}>
          <option value="ADJUST">Adjust (+/−)</option>
          <option value="RECEIVE">Receive stock</option>
        </select>
      </label>
      <label className="text-sm font-medium">Qty change
        <input className={inputCls} type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} required />
      </label>
      <label className="text-sm font-medium">Reason
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required />
      </label>
      <button disabled={busy} className="rounded-lg bg-admin px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply</button>
      {error ? <p className="w-full text-sm text-sale">{error}</p> : null}
      {done ? <p className="w-full text-sm text-brand-700">{done}</p> : null}
    </form>
  );
}

export function CouponForm() {
  const [form, setForm] = useState({ code: "", type: "PERCENT", discountPercent: 10, discountPaise: 0, minOrderPaise: 0, maxDiscountPaise: 0, usageLimit: 0, perUserLimit: 1, firstOrderOnly: false });
  const { submit, error, done, busy } = useAdminForm("/api/admin/coupons");
  const set = (k: string, v: string | number | boolean) => setForm({ ...form, [k]: v });
  return (
    <form
      className="grid gap-3 rounded-xl border border-adminline bg-white p-4 shadow-sm sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          code: form.code,
          type: form.type,
          discountPercent: form.type === "PERCENT" ? form.discountPercent : undefined,
          discountPaise: form.type === "FLAT" ? Math.round(Number(form.discountPaise) * 100) : undefined,
          minOrderPaise: Math.round(Number(form.minOrderPaise) * 100),
          maxDiscountPaise: form.maxDiscountPaise ? Math.round(Number(form.maxDiscountPaise) * 100) : undefined,
          usageLimit: form.usageLimit || undefined,
          perUserLimit: form.perUserLimit || undefined,
          firstOrderOnly: form.firstOrderOnly,
        });
      }}
    >
      <Field label="Code"><input className={inputCls} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required /></Field>
      <Field label="Type">
        <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat</option>
        </select>
      </Field>
      {form.type === "PERCENT" ? (
        <Field label="Discount %"><input className={inputCls} type="number" min={1} max={100} value={form.discountPercent} onChange={(e) => set("discountPercent", Number(e.target.value))} /></Field>
      ) : (
        <Field label="Discount (₹)"><input className={inputCls} type="number" min={0} value={form.discountPaise} onChange={(e) => set("discountPaise", e.target.value)} /></Field>
      )}
      <Field label="Min order (₹)"><input className={inputCls} type="number" min={0} value={form.minOrderPaise} onChange={(e) => set("minOrderPaise", e.target.value)} /></Field>
      <Field label="Max discount (₹, 0 = none)"><input className={inputCls} type="number" min={0} value={form.maxDiscountPaise} onChange={(e) => set("maxDiscountPaise", e.target.value)} /></Field>
      <Field label="Per-user limit"><input className={inputCls} type="number" min={0} value={form.perUserLimit} onChange={(e) => set("perUserLimit", Number(e.target.value))} /></Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => set("firstOrderOnly", e.target.checked)} /> First order only
      </label>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create coupon</button>
      {error ? <p className="text-sm text-sale sm:col-span-3">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700 sm:col-span-3">{done}</p> : null}
    </form>
  );
}

export function ZoneForm() {
  const [form, setForm] = useState({ name: "", pincodes: "", minOrder: 0, charge: 0, freeAbove: 0 });
  const { submit, error, done, busy } = useAdminForm("/api/admin/delivery?kind=zones");
  const set = (k: string, v: string | number) => setForm({ ...form, [k]: v });
  return (
    <form
      className="grid gap-3 rounded-xl border border-adminline bg-white p-4 shadow-sm sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ name: form.name, pincodes: form.pincodes.split(",").map((p) => p.trim()).filter(Boolean), minOrderPaise: Math.round(Number(form.minOrder) * 100), deliveryChargePaise: Math.round(Number(form.charge) * 100), freeThresholdPaise: form.freeAbove ? Math.round(Number(form.freeAbove) * 100) : undefined });
      }}
    >
      <Field label="Zone name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="PIN codes (comma separated)"><input className={inputCls} value={form.pincodes} onChange={(e) => set("pincodes", e.target.value)} required /></Field>
      <Field label="Min order (₹)"><input className={inputCls} type="number" min={0} value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} /></Field>
      <Field label="Delivery charge (₹)"><input className={inputCls} type="number" min={0} value={form.charge} onChange={(e) => set("charge", e.target.value)} /></Field>
      <Field label="Free above (₹, 0 = never)"><input className={inputCls} type="number" min={0} value={form.freeAbove} onChange={(e) => set("freeAbove", e.target.value)} /></Field>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create zone</button>
      {error ? <p className="text-sm text-sale sm:col-span-3">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700 sm:col-span-3">{done}</p> : null}
    </form>
  );
}

export function SlotForm({ zones }: { zones: Array<{ id: string; name: string }> }) {
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [label, setLabel] = useState("9 AM – 12 PM");
  const [capacity, setCapacity] = useState(50);
  const { submit, error, done, busy } = useAdminForm("/api/admin/delivery?kind=slots");
  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl border border-adminline bg-white p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ zoneId, label, capacity });
      }}
    >
      <label className="text-sm font-medium">Zone
        <select className={inputCls} value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">Slot label <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} required /></label>
      <label className="text-sm font-medium">Capacity <input className={inputCls} type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></label>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add slot</button>
      {error ? <p className="w-full text-sm text-sale">{error}</p> : null}
      {done ? <p className="w-full text-sm text-brand-700">{done}</p> : null}
    </form>
  );
}

export function CreditAdjustForm() {
  const [phone, setPhone] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [reason, setReason] = useState("Manual adjustment");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      const userRes = await fetch(`/api/admin/customers?q=${encodeURIComponent(phone)}`);
      const userJson = await userRes.json();
      const user = userJson.data?.items?.[0];
      if (!user) throw new Error("Customer not found for that phone number");
      await api("/api/admin/credit", { method: "POST", body: JSON.stringify({ userId: user.id, amountPaise: Math.round(parseFloat(amountRupees) * 100), reason }) });
      setDone("Store credit updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="flex flex-wrap items-end gap-2 rounded-xl border border-adminline bg-white p-4 shadow-sm" onSubmit={submit}>
      <label className="text-sm font-medium">Customer phone <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
      <label className="text-sm font-medium">Amount (₹, negative to deduct) <input className={inputCls} type="number" step="0.01" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} required /></label>
      <label className="text-sm font-medium">Reason <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required /></label>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply</button>
      {error ? <p className="w-full text-sm text-sale">{error}</p> : null}
      {done ? <p className="w-full text-sm text-brand-700">{done}</p> : null}
    </form>
  );
}

export function UserForm() {
  const [form, setForm] = useState({ username: "", email: "", password: "", roles: ["ORDER_STAFF"] });
  const { submit, error, done, busy } = useAdminForm("/api/admin/users");
  const set = (k: string, v: string | string[]) => setForm({ ...form, [k]: v });
  return (
    <form
      className="grid gap-3 rounded-xl border border-adminline bg-white p-4 shadow-sm sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...form, email: form.email || undefined });
      }}
    >
      <Field label="Username"><input className={inputCls} value={form.username} onChange={(e) => set("username", e.target.value)} required /></Field>
      <Field label="Email (optional)"><input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Temporary password"><input className={inputCls} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required /></Field>
      <Field label="Roles">
        <select className={inputCls} value={form.roles[0]} onChange={(e) => set("roles", [e.target.value])}>
          {["OWNER", "MANAGER", "ORDER_STAFF", "INVENTORY_STAFF", "DELIVERY_STAFF"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">Create staff account</button>
      {error ? <p className="text-sm text-sale sm:col-span-2">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700 sm:col-span-2">{done}</p> : null}
    </form>
  );
}

export function SettingsForm({ initial }: { initial: Record<string, unknown> }) {
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const { submit, error, done, busy } = useAdminForm("/api/admin/settings", "PUT");
  const store = (form.store as Record<string, unknown>) ?? {};
  const setStore = (k: string, v: unknown) => setForm({ ...form, store: { ...store, [k]: v } });
  return (
    <form
      className="grid gap-3 rounded-xl border border-adminline bg-white p-4 shadow-sm sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ store: form.store, busy: form.busy });
      }}
    >
      <Field label="Store name"><input className={inputCls} value={String(store.name ?? "")} onChange={(e) => setStore("name", e.target.value)} /></Field>
      <Field label="Phone"><input className={inputCls} value={String(store.phone ?? "")} onChange={(e) => setStore("phone", e.target.value)} /></Field>
      <Field label="Email"><input className={inputCls} value={String(store.email ?? "")} onChange={(e) => setStore("email", e.target.value)} /></Field>
      <Field label="GSTIN"><input className={inputCls} value={String(store.gstin ?? "")} onChange={(e) => setStore("gstin", e.target.value)} /></Field>
      <Field label="Address"><input className={inputCls} value={String(store.address ?? "")} onChange={(e) => setStore("address", e.target.value)} /></Field>
      <Field label="BUSY posting trigger">
        <select className={inputCls} value={String((form.busy as Record<string, unknown>)?.postingTrigger ?? "OUT_FOR_DELIVERY")} onChange={(e) => setForm({ ...form, busy: { postingTrigger: e.target.value } })}>
          {["ORDER_CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <button disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">Save settings</button>
      {error ? <p className="text-sm text-sale sm:col-span-2">{error}</p> : null}
      {done ? <p className="text-sm text-brand-700 sm:col-span-2">{done}</p> : null}
    </form>
  );
}

export function BulkImportForm() {
  const [csv, setCsv] = useState("sku,name,category,mrp,selling_price,variant,pack_size,stock\nSAMPLE-1,Sample Product,Staples,100,95,Standard,1 kg,10");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(preview: boolean) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await api("/api/admin/bulk/products", { method: "POST", body: JSON.stringify({ csv, preview }) });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Columns: sku, name, category, brand, mrp (₹), selling_price (₹), variant, variant_sku, pack_size, stock, barcode, gst_percent, description. Bad rows are reported, never silently ignored.
      </p>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} className="w-full rounded-lg border border-line px-3 py-2 font-mono text-sm" />
      <div className="flex gap-2">
        <button onClick={() => run(true)} disabled={busy} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Preview &amp; validate</button>
        <button onClick={() => run(false)} disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Import</button>
        <a href="/api/admin/bulk/products" className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold">Download current catalogue (CSV)</a>
      </div>
      {error ? <p className="text-sm text-sale">{error}</p> : null}
      {result ? <pre className="overflow-auto rounded-xl border border-adminline bg-white p-4 shadow-sm text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}

export function SyncJobButton() {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    setError("");
    setDone("");
    try {
      await api("/api/admin/integrations/sync", { method: "POST", body: JSON.stringify({ provider: "BUSY", entityType: "PRODUCT", entityId: "test", direction: "OUTBOUND", jobType: "OUTBOUND_ORDER_SYNC" }) });
      setDone("Sync job enqueued (BUSY is not connected, so it will fail gracefully and be logged).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button onClick={run} disabled={busy} className="rounded-lg bg-admin px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        Enqueue test sync job
      </button>
      {error ? <p className="mt-2 text-sm text-sale">{error}</p> : null}
      {done ? <p className="mt-2 text-sm text-brand-700">{done}</p> : null}
    </div>
  );
}
