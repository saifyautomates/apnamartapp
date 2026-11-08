"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface StoreBranding {
  name: string;
  tagline: string;
  logoUrl: string;
  appIconUrl: string;
  displayMode: "IMAGE_ONLY" | "IMAGE_AND_TEXT";
}

export const DEFAULT_BRANDING: StoreBranding = {
  name: "Central Mart",
  tagline: "India's Same-Day FMCG Grocery Store",
  logoUrl: "",
  appIconUrl: "",
  displayMode: "IMAGE_ONLY",
};

const BrandingContext = createContext<StoreBranding>(DEFAULT_BRANDING);

export function BrandingProvider({
  initial,
  children,
}: {
  initial?: Partial<StoreBranding>;
  children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<StoreBranding>({
    ...DEFAULT_BRANDING,
    ...(initial ?? {}),
  });

  useEffect(() => {
    // If initial prop changes (e.g. after Next.js router.refresh()), update state
    if (initial) {
      setBranding((prev) => ({
        ...prev,
        ...initial,
      }));
    }
  }, [initial]);

  useEffect(() => {
    // Real-time broadcast listener for instant cross-component updates without reload
    const handleUpdate = (e: CustomEvent<Partial<StoreBranding>>) => {
      if (e.detail && typeof e.detail === "object") {
        setBranding((prev) => ({
          ...prev,
          ...e.detail,
        }));
      }
    };

    window.addEventListener("store-settings-updated", handleUpdate as EventListener);
    return () => {
      window.removeEventListener("store-settings-updated", handleUpdate as EventListener);
    };
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): StoreBranding {
  const ctx = useContext(BrandingContext);
  return ctx || DEFAULT_BRANDING;
}

