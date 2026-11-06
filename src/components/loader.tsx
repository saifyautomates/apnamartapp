"use client";

import { useEffect, useState } from "react";

export default function LaunchLoader({ storeName }: { storeName: string; monogram?: string }) {
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
    const maxMs = mq.matches ? 300 : 700;
    const timer = window.setTimeout(hide, maxMs);
    if (document.readyState === "complete") {
      window.setTimeout(hide, mq.matches ? 100 : 250);
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
      className={`loader-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f8cb46] text-ink transition-opacity duration-300 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className={`flex flex-col items-center ${reduced ? "" : "loader-pop"}`}>
        <span className="text-4xl sm:text-5xl font-black tracking-tight text-ink">
          blink<span className="text-[#0c831f]">it</span>
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
          ⚡ 10 minute delivery
        </span>
      </div>
      <p className={`mt-4 text-xs font-bold text-slate-800 ${reduced ? "" : "loader-fade"}`}>
        {storeName} · Everything delivered fresh
      </p>
      <div className="mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-black/10" role="presentation">
        {!reduced ? <div className="loader-shimmer h-full w-1/2 rounded-full bg-[#0c831f]" /> : <div className="h-full w-full bg-[#0c831f]" />}
      </div>
    </div>
  );
}
