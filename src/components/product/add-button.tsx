"use client";

import { useEffect, useState, useRef } from "react";
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
  const [error, setError] = useState("");
  const pendingQtyRef = useRef<number>(initialQty);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQty(initialQty);
    pendingQtyRef.current = initialQty;
  }, [initialQty]);

  // Keep all button instances synchronized with cart state
  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ lines?: Array<{ variantId: string; qty: number }> }>;
      if (customEvent.detail?.lines) {
        const found = customEvent.detail.lines.find((l) => l.variantId === variantId);
        const serverQty = found ? found.qty : 0;
        setQty(serverQty);
        pendingQtyRef.current = serverQty;
      }
    };
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [variantId]);

  function setQuantity(next: number) {
    const prev = qty;
    const targetQty = Math.max(0, next);
    setQty(targetQty); // 0ms Instant Optimistic Feedback
    pendingQtyRef.current = targetQty;
    setError("");

    // Native micro-haptic pulse on mobile devices
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const finalQty = pendingQtyRef.current;
        const data = await api<{ lines?: Array<{ variantId: string; qty: number }> }>("/api/cart", {
          method: "POST",
          body: JSON.stringify({ variantId, qty: finalQty }),
        });
        window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
      } catch (e) {
        setQty(prev); // Revert on actual network failure
        setError(e instanceof Error ? e.message : "Failed");
      }
    }, 160);
  }

  if (qty <= 0) {
    return (
      <div className={`relative select-none ${className}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setQuantity(1);
          }}
          className="group relative w-full overflow-hidden rounded-xl border-2 border-[#0c831f] bg-white hover:bg-emerald-50/70 px-3 py-1.5 text-xs font-black text-[#0c831f] tracking-wider uppercase shadow-[0_2px_8px_rgba(12,131,31,0.08)] hover:shadow-[0_4px_12px_rgba(12,131,31,0.18)] transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center gap-1"
          aria-label="Add to cart"
        >
          <span className="text-[11px] font-black text-[#0c831f]">ADD</span>
          <span className="text-[#0c831f] font-bold text-sm leading-none -mt-0.5 group-hover:scale-125 transition-transform">+</span>
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
    <div className={`relative select-none ${className}`}>
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#0c831f] via-[#0d8e23] to-[#0a701a] text-white shadow-[0_4px_12px_rgba(12,131,31,0.25)] ring-1 ring-emerald-400/40 animate-in zoom-in-95 duration-150">
        <button
          aria-label="Decrease quantity"
          onClick={(e) => {
            e.stopPropagation();
            setQuantity(qty - 1);
          }}
          className="flex h-7 w-7 items-center justify-center text-sm font-black hover:bg-black/15 rounded-l-xl transition-all duration-150 active:scale-75 cursor-pointer"
        >
          −
        </button>
        <span className="tabular-nums font-black text-xs px-1 min-w-[20px] text-center select-none">
          {qty}
        </span>
        <button
          aria-label="Increase quantity"
          onClick={(e) => {
            e.stopPropagation();
            setQuantity(qty + 1);
          }}
          className="flex h-7 w-7 items-center justify-center text-sm font-black hover:bg-black/15 rounded-r-xl transition-all duration-150 active:scale-75 cursor-pointer"
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
