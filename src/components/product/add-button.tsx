"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export interface AddButtonProps {
  variantId: string;
  initialQty?: number;
  className?: string;
}

export function AddButton({
  variantId,
  initialQty = 0,
  className = "",
}: AddButtonProps) {
  const [qty, setQty] = useState(initialQty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQty(initialQty);
  }, [initialQty]);

  // Keep all button instances synchronized with cart state
  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ lines?: Array<{ variantId: string; qty: number }> }>;
      if (customEvent.detail?.lines) {
        const found = customEvent.detail.lines.find((l) => l.variantId === variantId);
        setQty(found ? found.qty : 0);
      }
    };
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [variantId]);

  async function setQuantity(next: number) {
    const prev = qty;
    setQty(next); // optimistic update
    setBusy(true);
    setError("");
    try {
      const data = await api<{ lines?: Array<{ variantId: string; qty: number }> }>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ variantId, qty: next }),
      });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
    } catch (e) {
      setQty(prev); // revert on failure
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (qty <= 0) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setQuantity(1)}
          disabled={busy}
          className="w-full rounded-xl border-2 border-[#0c831f] bg-white hover:bg-[#e8f5e9] px-3 py-1.5 text-xs font-black text-[#0c831f] tracking-wider uppercase shadow-xs transition active:scale-90 disabled:opacity-50 cursor-pointer"
          aria-label="Add to cart"
        >
          ADD
        </button>
        {error ? (
          <p className="absolute left-0 right-0 top-full mt-0.5 text-[10px] text-red-500 font-bold truncate">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between rounded-xl bg-[#0c831f] text-white shadow-xs">
        <button
          aria-label="Decrease quantity"
          onClick={() => setQuantity(qty - 1)}
          disabled={busy}
          className="px-2.5 py-1 text-sm font-black hover:bg-[#0a701a] rounded-l-xl transition active:scale-90 disabled:opacity-50 cursor-pointer select-none"
        >
          −
        </button>
        <span className="text-xs font-black px-1 min-w-5 text-center select-none">{qty}</span>
        <button
          aria-label="Increase quantity"
          onClick={() => setQuantity(qty + 1)}
          disabled={busy}
          className="px-2.5 py-1 text-sm font-black hover:bg-[#0a701a] rounded-r-xl transition active:scale-90 disabled:opacity-50 cursor-pointer select-none"
        >
          +
        </button>
      </div>
      {error ? (
        <p className="absolute left-0 right-0 top-full mt-0.5 text-[10px] text-red-500 font-bold truncate">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AddButton;
