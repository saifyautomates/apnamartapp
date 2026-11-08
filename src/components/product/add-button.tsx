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
    }, 180);
  }

  if (qty <= 0) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setQuantity(1)}
          className="w-full rounded-xl border-2 border-[#0c831f] bg-white hover:bg-[#e8f5e9] px-3 py-1.5 text-xs font-black text-[#0c831f] tracking-wider uppercase shadow-xs transition active:scale-90 cursor-pointer"
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
          className="px-2.5 py-1 text-sm font-black hover:bg-[#0a701a] rounded-l-xl transition active:scale-90 cursor-pointer select-none"
        >
          −
        </button>
        <span className="text-xs font-black px-1 min-w-5 text-center select-none">{qty}</span>
        <button
          aria-label="Increase quantity"
          onClick={() => setQuantity(qty + 1)}
          className="px-2.5 py-1 text-sm font-black hover:bg-[#0a701a] rounded-r-xl transition active:scale-90 cursor-pointer select-none"
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
