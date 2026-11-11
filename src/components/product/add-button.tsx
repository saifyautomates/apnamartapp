"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api/client";

export interface AddButtonProps {
  variantId: string;
  initialQty?: number;
  className?: string;
}

function playCartPop(direction: "up" | "down" = "up") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sine";
    if (direction === "up") {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    /* AudioContext blocked or not supported */
  }
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

    // Check cached cart if initialQty is 0
    if (initialQty === 0 && typeof window !== "undefined" && (window as any).__centralMartCart?.lines) {
      const lines = (window as any).__centralMartCart.lines as Array<{ variantId: string; qty: number }>;
      const found = lines.find((l) => l.variantId === variantId);
      if (found) {
        setQty(found.qty);
        pendingQtyRef.current = found.qty;
      }
    }
  }, [initialQty, variantId]);

  // Keep all button instances synchronized with cart state
  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ lines?: Array<{ variantId: string; qty: number }> }>;
      if (customEvent.detail && typeof customEvent.detail === "object") {
        (window as any).__centralMartCart = customEvent.detail;
      }
      const lines = customEvent.detail?.lines || (typeof window !== "undefined" ? (window as any).__centralMartCart?.lines : null);
      if (lines) {
        const found = lines.find((l: any) => l.variantId === variantId);
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

    // Subtle audio micro-pop feedback
    playCartPop(next > prev ? "up" : "down");

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
