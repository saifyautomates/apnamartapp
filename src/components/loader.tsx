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
        {/* Animated Cart Emblem */}
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0c831f] to-[#15803d] shadow-lg flex items-center justify-center text-white mb-3 ring-4 ring-white/30 transform hover:scale-105 transition">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>

        {/* Brand Wordmark */}
        <div className="text-4xl sm:text-5xl font-black tracking-tight font-sans">
          <span className="text-[#1c1c1c]">central</span>
          <span className="text-[#0c831f]">mart</span>
        </div>

        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#1c1c1c] text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm">
          ⚡ 8 Minute Delivery
        </span>
      </div>

      <p className={`mt-4 text-xs font-bold text-neutral-800 ${reduced ? "" : "loader-fade"}`}>
        {storeName ?? "Central Mart"} · India&apos;s Fastest Grocery App
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
