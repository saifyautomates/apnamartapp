"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";

const STORAGE_KEY = "cm_wishlist_ids";

function getLocalWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalWishlist(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota errors */
  }
}

export function useWishlist(variantId?: string) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const sync = useCallback(() => {
    setWishlistIds(getLocalWishlist());
  }, []);

  useEffect(() => {
    sync();

    // Optionally sync with backend if logged in
    fetch("/api/account/wishlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          const serverIds = data.data.map((item: any) => item.variantId || item.id);
          const merged = Array.from(new Set([...getLocalWishlist(), ...serverIds]));
          setLocalWishlist(merged);
          setWishlistIds(merged);
        }
      })
      .catch(() => undefined);

    const onUpdate = () => sync();
    window.addEventListener("wishlist-updated", onUpdate);
    return () => window.removeEventListener("wishlist-updated", onUpdate);
  }, [sync]);

  const toggleWishlist = useCallback(
    async (idToToggle?: string) => {
      const targetId = idToToggle || variantId;
      if (!targetId) return;

      const current = getLocalWishlist();
      const exists = current.includes(targetId);
      const next = exists ? current.filter((id) => id !== targetId) : [...current, targetId];

      setLocalWishlist(next);
      setWishlistIds(next);
      window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { ids: next } }));

      // Sync with server if customer is logged in
      try {
        if (exists) {
          await api(`/api/account/wishlist?variantId=${targetId}`, { method: "DELETE" }).catch(() => undefined);
        } else {
          await api("/api/account/wishlist", {
            method: "POST",
            body: JSON.stringify({ variantId: targetId }),
          }).catch(() => undefined);
        }
      } catch {
        /* guest fallback */
      }
    },
    [variantId]
  );

  return {
    isWishlisted: variantId ? wishlistIds.includes(variantId) : false,
    toggleWishlist,
    wishlistIds,
    count: wishlistIds.length,
  };
}

export default useWishlist;

