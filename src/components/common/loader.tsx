"use client";

import { useEffect, useState } from "react";

export default function LaunchLoader({ storeName }: { storeName?: string; monogram?: string }) {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    let done = false;
    const hide = () => {
      if (done) return;
      done = true;
      setHidden(true);
      window.setTimeout(() => setRemoved(true), 350);
    };
    const maxMs = mq.matches ? 300 : 750;
    const timer = window.setTimeout(hide, maxMs);
    if (document.readyState === "complete") {
      window.setTimeout(hide, mq.matches ? 100 : 300);
    } else {
      window.addEventListener("load", hide, { once: true });
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", hide);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden="true"
      className={`loader-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#f8cb46] via-[#f7c234] to-[#f5b820] text-[#1c1c1c] transition-opacity duration-300 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className={`flex flex-col items-center ${reduced ? "" : "loader-pop"}`}>
        {/* Authentic 3D Central Mart App Emblem */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Central Mart Logo"
            width="88"
            height="88"
            className="h-20 w-20 sm:h-22 sm:w-22 rounded-3xl object-contain shadow-2xl ring-4 ring-white/60 transform hover:scale-105 transition-transform"
          />
        </div>

        {/* Brand Wordmark */}
        <div className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
          <span className="text-[#1c1c1c]">central</span>
          <span className="text-[#0c831f]">mart</span>
        </div>

        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#1c1c1c] text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm">
          ⚡ 10-15 Min Kota Delivery
        </span>
      </div>

      <p className={`mt-4 text-xs font-bold text-neutral-800 ${reduced ? "" : "loader-fade"}`}>
        {storeName ?? "Central Mart"} · Same-Day FMCG Grocery Store
      </p>

      {/* Shimmer Bar */}
      <div className="mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-black/10" role="presentation">
        {!reduced ? (
          <div className="loader-shimmer h-full w-1/2 rounded-full bg-[#0c831f]" />
        ) : (
          <div className="h-full w-full bg-[#0c831f]" />
        )}
      </div>
    </div>
  );
}
