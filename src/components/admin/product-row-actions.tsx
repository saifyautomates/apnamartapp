"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, Check } from "lucide-react";

export function ProductRowActions({
  productId,
  variantId,
  currentStock,
}: {
  productId: string;
  variantId: string;
  currentStock: number;
}) {
  const router = useRouter();
  const [stock, setStock] = useState(currentStock);
  const [busy, setBusy] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [delta, setDelta] = useState(10);
  const [msg, setMsg] = useState("");

  async function handleAdjust(type: "add" | "sub") {
    setBusy(true);
    setMsg("");
    const change = type === "add" ? Math.abs(delta) : -Math.abs(delta);
    try {
      await api("/api/admin/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          variantId,
          delta: change,
          reason: "Manual adjustment via Admin Products Table",
          kind: "ADJUST",
        }),
      });
      setStock((prev) => Math.max(0, prev + change));
      setMsg("✓ Saved");
      setTimeout(() => {
        setMsg("");
        setShowAdjust(false);
      }, 1500);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to deactivate and remove this product?")) return;
    setBusy(true);
    try {
      await api(`/api/admin/products/${productId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {showAdjust ? (
        <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-1 shadow-sm animate-in fade-in duration-100">
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
            className="w-12 px-1 text-xs font-mono font-bold text-center border-b border-neutral-300 focus:outline-none"
            min={1}
          />
          <button
            onClick={() => handleAdjust("sub")}
            disabled={busy}
            className="h-6 w-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-black cursor-pointer"
            title="Deduct stock"
          >
            -
          </button>
          <button
            onClick={() => handleAdjust("add")}
            disabled={busy}
            className="h-6 w-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-black cursor-pointer"
            title="Add stock"
          >
            +
          </button>
          <button
            onClick={() => setShowAdjust(false)}
            className="text-[10px] text-neutral-400 hover:text-neutral-600 px-1 cursor-pointer"
          >
            ✕
          </button>
          {msg ? <span className="text-[10px] text-emerald-600 font-bold px-1">{msg}</span> : null}
        </div>
      ) : (
        <button
          onClick={() => setShowAdjust(true)}
          className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 px-2 py-1 text-[11px] font-bold text-neutral-700 transition cursor-pointer"
          title="Adjust inventory stock"
        >
          Stock ({stock})
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={busy}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
        title="Delete / Deactivate product"
        aria-label="Delete product"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ProductRowActions;
