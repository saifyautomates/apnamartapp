"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

let csrfToken: string | null = null;

export async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch("/api/auth/csrf");
    const json = await res.json();
    csrfToken = json.data?.csrfToken as string;
    return csrfToken ?? "";
  } catch {
    return "";
  }
}

export async function api(path: string, init: RequestInit = {}) {
  const token = await ensureCsrf();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-csrf-token": token, ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data;
}

/** Product image with local fallback and subtle hover animation. */
export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      loading="lazy"
      className={`transition-transform duration-200 group-hover:scale-105 ${className}`}
      onError={() => {
        if (imgSrc !== "/placeholder.svg") {
          setImgSrc("/placeholder.svg");
        }
      }}
    />
  );
}

/** Standalone search bar (can be embedded in pages or fallback). */
export function SearchBar({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string; brand?: { name: string } | null }>>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setSuggestions(json.data?.suggestions ?? []);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative w-full">
      <form
        action="/search"
        method="get"
        onSubmit={(e) => {
          if (!q.trim()) e.preventDefault();
        }}
      >
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Search atta, milk, Maggi, cold drinks…"
            aria-label="Search products"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-ink font-medium shadow-xs focus:border-emerald-600 focus:outline-hidden"
          />
        </div>
      </form>
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl">
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link href={`/product/${s.slug}`} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50">
                <span className="font-semibold text-ink">{s.name}</span>
                {s.brand?.name ? <span className="text-xs text-muted">{s.brand.name}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Blinkit signature ADD button that morphs into a `- [qty] +` stepper. */
export function AddButton({
  variantId,
  initialQty = 0,
  className = "",
}: {
  variantId: string;
  initialQty?: number;
  className?: string;
}) {
  const [qty, setQty] = useState(initialQty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Sync state if initialQty changes
  useEffect(() => {
    setQty(initialQty);
  }, [initialQty]);

  async function setQuantity(next: number) {
    const prev = qty;
    setQty(next); // optimistic update
    setBusy(true);
    setError("");
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ variantId, qty: next }) });
      window.dispatchEvent(new Event("cart-updated"));
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
          className="w-full rounded-lg border border-emerald-600 bg-emerald-50/40 hover:bg-emerald-600 hover:text-white px-3 py-1.5 text-xs font-black text-emerald-700 tracking-wider uppercase shadow-xs transition active:scale-95 disabled:opacity-50"
          aria-label="Add to cart"
        >
          ADD
        </button>
        {error ? <p className="absolute left-0 right-0 top-full mt-0.5 text-[10px] text-red-500 font-bold truncate">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between rounded-lg bg-emerald-700 text-white shadow-xs">
        <button
          aria-label="Decrease quantity"
          onClick={() => setQuantity(qty - 1)}
          disabled={busy}
          className="px-2.5 py-1 text-sm font-extrabold hover:bg-emerald-800 rounded-l-lg transition active:scale-90 disabled:opacity-50"
        >
          −
        </button>
        <span className="text-xs font-black px-1 min-w-5 text-center">{qty}</span>
        <button
          aria-label="Increase quantity"
          onClick={() => setQuantity(qty + 1)}
          disabled={busy}
          className="px-2.5 py-1 text-sm font-extrabold hover:bg-emerald-800 rounded-r-lg transition active:scale-90 disabled:opacity-50"
        >
          +
        </button>
      </div>
      {error ? <p className="absolute left-0 right-0 top-full mt-0.5 text-[10px] text-red-500 font-bold truncate">{error}</p> : null}
    </div>
  );
}
