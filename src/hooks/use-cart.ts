"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";

export interface CartState {
  count: number;
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  items: Array<{
    id: string;
    variantId: string;
    qty: number;
    unitPricePaise: number;
    subtotalPaise: number;
    variant: {
      id: string;
      name?: string | null;
      packSize?: string | null;
      sellingPaise: number;
      mrpPaise: number;
      product: {
        id: string;
        name: string;
        slug: string;
        images?: Array<{ url: string }>;
      };
    };
  }>;
}

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    count: 0,
    subtotalPaise: 0,
    deliveryPaise: 0,
    totalPaise: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await api<CartState>("/api/cart");
      if (data) {
        setCart({
          count: data.count ?? 0,
          subtotalPaise: data.subtotalPaise ?? 0,
          deliveryPaise: data.deliveryPaise ?? 0,
          totalPaise: data.totalPaise ?? 0,
          items: data.items ?? [],
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const updateItem = useCallback(
    async (variantId: string, qty: number) => {
      setLoading(true);
      try {
        await api("/api/cart", {
          method: "POST",
          body: JSON.stringify({ variantId, qty }),
        });
        window.dispatchEvent(new Event("cart-updated"));
        await fetchCart();
      } finally {
        setLoading(false);
      }
    },
    [fetchCart]
  );

  useEffect(() => {
    fetchCart();
    const handleUpdate = () => fetchCart();
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, [fetchCart]);

  return { cart, loading, fetchCart, updateItem };
}

