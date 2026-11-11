"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";

export interface CartItemDetail {
  id?: string;
  variantId: string;
  qty: number;
  unitPricePaise: number;
  subtotalPaise?: number;
  lineTotalPaise?: number;
  mrpPaise?: number;
  name?: string;
  variantName?: string | null;
  slug?: string;
  imageUrl?: string | null;
  sellable?: number;
  inStock?: boolean;
}

export interface CartState {
  count: number;
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  mrpTotalPaise?: number;
  savingsPaise?: number;
  items: CartItemDetail[];
  lines?: CartItemDetail[];
}

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    count: 0,
    subtotalPaise: 0,
    deliveryPaise: 0,
    totalPaise: 0,
    mrpTotalPaise: 0,
    savingsPaise: 0,
    items: [],
    lines: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await api<any>("/api/cart");
      if (data) {
        const rawItems = data.lines ?? data.items ?? [];
        setCart({
          count: data.count ?? rawItems.reduce((acc: number, item: any) => acc + (item.qty || 0), 0),
          subtotalPaise: data.subtotalPaise ?? 0,
          deliveryPaise: data.deliveryPaise ?? 0,
          totalPaise: data.totalPaise ?? data.subtotalPaise ?? 0,
          mrpTotalPaise: data.mrpTotalPaise ?? 0,
          savingsPaise: data.savingsPaise ?? 0,
          items: rawItems,
          lines: rawItems,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const updateItem = useCallback(
    async (variantId: string, qty: number) => {
      setLoading(true);
      // Optimistic 0ms calculation
      setCart((prev) => {
        const lines = prev.items || [];
        let newLines = lines.map((l) =>
          l.variantId === variantId
            ? { ...l, qty, lineTotalPaise: l.unitPricePaise * qty }
            : l
        );
        if (qty <= 0) {
          newLines = newLines.filter((l) => l.variantId !== variantId);
        }
        const newSubtotal = newLines.reduce((sum, l) => sum + ((l.lineTotalPaise ?? l.unitPricePaise * l.qty)), 0);
        const newCount = newLines.reduce((sum, l) => sum + l.qty, 0);
        return {
          ...prev,
          items: newLines,
          lines: newLines,
          subtotalPaise: newSubtotal,
          totalPaise: newSubtotal + prev.deliveryPaise,
          count: newCount,
        };
      });

      try {
        if (qty <= 0) {
          const res = await api<any>(`/api/cart?variantId=${encodeURIComponent(variantId)}`, {
            method: "DELETE",
          });
          window.dispatchEvent(new CustomEvent("cart-updated", { detail: res }));
        } else {
          const res = await api<any>("/api/cart", {
            method: "POST",
            body: JSON.stringify({ variantId, qty }),
          });
          window.dispatchEvent(new CustomEvent("cart-updated", { detail: res }));
        }
        await fetchCart();
      } catch (err) {
        await fetchCart(); // rollback on failure
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>("/api/cart?clearAll=true", { method: "DELETE" });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: res }));
      await fetchCart();
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  useEffect(() => {
    fetchCart();
    const handleUpdate = () => fetchCart();
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, [fetchCart]);

  return { cart, loading, fetchCart, updateItem, clearCart };
}

export default useCart;
