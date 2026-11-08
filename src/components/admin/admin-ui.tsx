"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api/client";
import { ensureCsrf } from "@/lib/api/csrf";
import { useRouter } from "next/navigation";
import { CentralMartLogo } from "@/components/ui/logo";

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

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const appIconInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const logoUrl = String(store.logoUrl ?? "");
  const appIconUrl = String(store.appIconUrl ?? "");
  const storeName = String(store.name ?? "Central Mart");
  const displayMode = (store.displayMode as "IMAGE_ONLY" | "IMAGE_AND_TEXT") ?? "IMAGE_ONLY";

  async function handleFileUpload(file: File, target: "logo" | "appIcon") {
    const isLogo = target === "logo";
    if (isLogo) setUploadingLogo(true);
    else setUploadingAppIcon(true);
    setUploadMsg("");

    try {
      const token = await ensureCsrf();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", isLogo ? "logos" : "icons");

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "x-csrf-token": token },
        body: formData,
      });

      if (!res.ok) {
        // Fallback to local Data URL preview if storage not configured
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setStore(isLogo ? "logoUrl" : "appIconUrl", reader.result);
            setUploadMsg(`Loaded from device. Remember to click "Save settings" below.`);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      const json = await res.json();
      if (json.data?.url) {
        setStore(isLogo ? "logoUrl" : "appIconUrl", json.data.url);
        setUploadMsg(`Uploaded successfully. Remember to click "Save settings" below.`);
      }
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingAppIcon(false);
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit({
      store: form.store,
      busy: form.busy,
      delivery: form.delivery,
      tax: form.tax,
      payments: form.payments,
      loyalty: form.loyalty,
    });
    if (ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("store-settings-updated", { detail: form.store })
        );
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit}>
      {/* 1. STORE LOGO & HEADER BRANDING */}
      <div className="rounded-2xl border border-adminline bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-sm font-bold">
                🏪
              </span>
              <h3 className="text-base font-bold text-neutral-900">Store Logo &amp; Header Branding</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Shown in desktop navigation, mobile header, invoices, and confirmation emails.
            </p>
          </div>
          {logoUrl ? (
            <button
              type="button"
              onClick={() => setStore("logoUrl", "")}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer self-start sm:self-auto"
            >
              Reset to Default SVG Logo
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Default Signature Brand Mark Active
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-3">
            <Field label="Store Logo Image URL (CDN / Static / Upload)">
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="https://... or /uploads/..."
                  value={logoUrl}
                  onChange={(e) => setStore("logoUrl", e.target.value)}
                />
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setStore("logoUrl", "")}
                    className="shrink-0 px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </Field>

            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "logo");
                }}
              />
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition cursor-pointer disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Uploading logo...
                  </>
                ) : (
                  <>
                    <span>📁</span> Choose Logo from Device (PNG, SVG, WebP, JPEG)
                  </>
                )}
              </button>
            </div>

            <Field label="Logo Display Mode">
              <select
                className={inputCls}
                value={displayMode}
                onChange={(e) => setStore("displayMode", e.target.value)}
              >
                <option value="IMAGE_ONLY">Banner Logo (Image replaces wordmark)</option>
                <option value="IMAGE_AND_TEXT">Emblem + Store Name (Image beside name text)</option>
              </select>
            </Field>
          </div>

          {/* Live Previews */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Live Header Previews</p>

            {/* Desktop / Light Header Preview */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Desktop Light Header
              </div>
              <div className="flex items-center min-h-[44px] px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200/60">
                <CentralMartLogo
                  logoUrl={logoUrl}
                  storeName={storeName}
                  displayMode={displayMode}
                  theme="light"
                  size="sm"
                />
              </div>
            </div>

            {/* Mobile / Green Header Preview */}
            <div className="rounded-xl border border-emerald-900 bg-[#0a6833] p-3 shadow-xs">
              <div className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider mb-1.5">
                Mobile Green Header (Phone Top Bar)
              </div>
              <div className="flex items-center min-h-[44px] px-3 py-2 rounded-lg bg-white/10 backdrop-blur-xs">
                <CentralMartLogo
                  logoUrl={logoUrl}
                  storeName={storeName}
                  displayMode={displayMode}
                  theme="greenHeader"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. APP LOGO & PWA LAUNCHER ICON */}
      <div className="rounded-2xl border border-adminline bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-sm font-bold">
                📱
              </span>
              <h3 className="text-base font-bold text-neutral-900">App Logo &amp; PWA Launcher Icon</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              App tile icon on customer home screens (Android / iOS Add to Home Screen) and launch splash loader.
            </p>
          </div>
          {appIconUrl ? (
            <button
              type="button"
              onClick={() => setStore("appIconUrl", "")}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer self-start sm:self-auto"
            >
              Reset to Default Central Mart Icon
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Default 512x512 Central Mart Icon Active
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-3">
            <Field label="App Icon Image URL (192x192 / 512x512 Square PNG)">
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="https://... or /uploads/..."
                  value={appIconUrl}
                  onChange={(e) => setStore("appIconUrl", e.target.value)}
                />
                {appIconUrl && (
                  <button
                    type="button"
                    onClick={() => setStore("appIconUrl", "")}
                    className="shrink-0 px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </Field>

            <div>
              <input
                ref={appIconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "appIcon");
                }}
              />
              <button
                type="button"
                disabled={uploadingAppIcon}
                onClick={() => appIconInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition cursor-pointer disabled:opacity-50"
              >
                {uploadingAppIcon ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Uploading app icon...
                  </>
                ) : (
                  <>
                    <span>📱</span> Choose App Icon from Device (Square PNG / WebP / JPEG)
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-neutral-400">
              Tip: Upload a 512x512 square image with rich contrast so it looks crisp on high-DPI Android and iPhone home screens.
            </p>
          </div>

          {/* Live Previews */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Live App Previews</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Home Screen Icon Tile */}
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-100 to-neutral-200/60 p-3 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Home Screen Tile
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={appIconUrl || "/icons/icon-192.png"}
                  alt="App Icon"
                  className="h-16 w-16 rounded-2xl object-contain drop-shadow-md"
                />
                <span className="text-[11px] font-bold text-neutral-800 mt-1.5 truncate max-w-[100px]">
                  {storeName}
                </span>
              </div>

              {/* Splash Loader Preview */}
              <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-[#f8cb46] to-[#f5b820] p-3 text-center flex flex-col items-center justify-center text-neutral-900 shadow-xs">
                <div className="text-[10px] font-black text-amber-950/70 uppercase tracking-wider mb-2">
                  Launch Splash Screen
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={appIconUrl || "/icons/icon-192.png"}
                  alt="Splash Icon"
                  className="h-12 w-12 rounded-xl object-contain drop-shadow-md mb-1"
                />
                <span className="text-xs font-black tracking-tight text-neutral-900 truncate">
                  {storeName}
                </span>
                <div className="h-1 w-16 bg-emerald-700 rounded-full mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STORE DETAILS & CONTACT */}
      <div className="rounded-2xl border border-adminline bg-white p-5 shadow-sm">
        <div className="pb-4 border-b border-neutral-100 mb-4">
          <h3 className="text-base font-bold text-neutral-900">Store Information &amp; Settings</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Basic store business details used across invoices and legal footers.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Store name">
            <input
              className={inputCls}
              value={storeName}
              onChange={(e) => setStore("name", e.target.value)}
            />
          </Field>
          <Field label="Store Tagline">
            <input
              className={inputCls}
              placeholder="e.g. India's Same-Day FMCG Grocery Store"
              value={String(store.tagline ?? "")}
              onChange={(e) => setStore("tagline", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              value={String(store.phone ?? "")}
              onChange={(e) => setStore("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              value={String(store.email ?? "")}
              onChange={(e) => setStore("email", e.target.value)}
            />
          </Field>
          <Field label="GSTIN">
            <input
              className={inputCls}
              value={String(store.gstin ?? "")}
              onChange={(e) => setStore("gstin", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <input
              className={inputCls}
              value={String(store.address ?? "")}
              onChange={(e) => setStore("address", e.target.value)}
            />
          </Field>
          <Field label="BUSY posting trigger">
            <select
              className={inputCls}
              value={String(
                (form.busy as Record<string, unknown>)?.postingTrigger ?? "OUT_FOR_DELIVERY"
              )}
              onChange={(e) =>
                setForm({ ...form, busy: { postingTrigger: e.target.value } })
              }
            >
              {["ORDER_CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* FEEDBACK MESSAGES & SAVE BUTTON */}
      {uploadMsg && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-800 font-medium">
          ℹ️ {uploadMsg}
        </div>
      )}
      {error ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-800 font-medium">
          ❌ {error}
        </div>
      ) : null}
      {done ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-bold">
          ✅ {done} All store logos, app icons, and branding settings have been updated across the entire platform.
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={busy || uploadingLogo || uploadingAppIcon}
          className="rounded-xl bg-[#0c831f] hover:bg-[#0a6833] text-white px-6 py-3 text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
        >
          {busy ? "Saving Settings..." : "Save Settings & Update Branding Everywhere"}
        </button>
      </div>
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
      const data = await api<Record<string, unknown>>("/api/admin/bulk/products", { method: "POST", body: JSON.stringify({ csv, preview }) });
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

export function FmcgScaleTool() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);

  async function triggerSeed(count: number, preview = false) {
    setBusy(true);
    setError("");
    setStatus(null);
    try {
      const data = await api<Record<string, unknown>>("/api/admin/bulk/fmcg-seed", {
        method: "POST",
        body: JSON.stringify({ count, preview }),
      });
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to seed catalogue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0c831f] text-white text-sm font-bold">
              ⚡
            </span>
            <h2 className="text-base font-black text-[#1c1c1c]">
              FMCG 5,000 Products Catalogue Engine
            </h2>
          </div>
          <p className="mt-1 text-xs text-neutral-500 max-w-2xl leading-relaxed">
            Instantly seed or scale your Central Mart grocery inventory up to 5,000 authentic Indian FMCG SKUs.
            Includes genuine brands (Amul, Britannia, Aashirvaad, Fortune, Tata, Lay&apos;s, Surf Excel, Colgate, etc.)
            with verified barcodes, MRPs, discount pricing, GST rates, and live stock allocations.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#e8f5e9] text-[#0c831f] text-xs font-black px-3 py-1 border border-[#0c831f]/20">
          Upto 5,000 SKUs
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => triggerSeed(100, true)}
          disabled={busy}
          className="rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 p-3 text-left transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <div className="text-xs font-black text-neutral-700">Preview 15 Sample SKUs</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Dry-run validation</div>
        </button>

        <button
          type="button"
          onClick={() => triggerSeed(500, false)}
          disabled={busy}
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 p-3 text-left transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <div className="text-xs font-black text-[#0c831f]">🚀 Seed 500 Fast SKUs</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Top essential staples</div>
        </button>

        <button
          type="button"
          onClick={() => triggerSeed(1000, false)}
          disabled={busy}
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 p-3 text-left transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <div className="text-xs font-black text-[#0c831f]">🚀 Seed 1,000 SKUs</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Full FMCG department</div>
        </button>

        <button
          type="button"
          onClick={() => triggerSeed(5000, false)}
          disabled={busy}
          className="rounded-xl bg-gradient-to-tr from-[#0c831f] to-[#15803d] text-white p-3 text-left shadow-sm hover:brightness-105 transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <div className="text-xs font-black">🔥 Scale to 5,000 SKUs</div>
          <div className="text-[11px] text-emerald-100 mt-0.5">Mega dark-store catalogue</div>
        </button>
      </div>

      {busy ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-[#0c831f]">
          <div className="h-4 w-4 rounded-full border-2 border-[#0c831f] border-t-transparent animate-spin" />
          <span>Processing FMCG database transaction at scale… Please wait a few seconds.</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#0c831f]">
              {String(status.message ?? "Operation completed")}
            </span>
            <a
              href="/admin/products"
              className="text-xs font-black text-[#0c831f] hover:underline"
            >
              View Updated Products Catalogue →
            </a>
          </div>
          <pre className="overflow-x-auto text-[11px] font-mono text-neutral-700 bg-white p-3 rounded-lg border border-emerald-100 max-h-48">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      ) : null}
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
