"use client";

import { useEffect, useState } from "react";
import { CentralMartLogo } from "./logo";
import { Zap, Sparkles } from "lucide-react";

export function AppLaunchSplash() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  const triggerAnimation = () => {
    setShow(true);
    setFading(false);
    const t1 = setTimeout(() => setFading(true), 1100);
    const t2 = setTimeout(() => setShow(false), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forceLaunch = urlParams.get("appLaunch") === "1" || urlParams.get("splash") === "1";
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (forceLaunch || isStandalone) {
        triggerAnimation();
      }
    } catch {
      /* ignore */
    }

    const handleCustomTrigger = () => triggerAnimation();
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "TRIGGER_SPLASH") triggerAnimation();
    };

    window.addEventListener("trigger-splash", handleCustomTrigger);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("trigger-splash", handleCustomTrigger);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      onClick={() => setShow(false)}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#032e16] via-[#063b1e] to-[#042412] text-white transition-all duration-400 cursor-pointer ${
        fading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Top spacing */}
      <div className="pt-8 flex items-center gap-1.5 opacity-80">
        <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-ping" />
        <span className="text-[11px] font-black tracking-widest uppercase text-emerald-200">
          Fast FMCG Delivery • Kota
        </span>
      </div>

      {/* Center Branding & Animated Shopping Cart */}
      <div className="flex flex-col items-center text-center space-y-5 animate-in zoom-in-90 duration-500">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0c831f] to-[#063b1e] text-white shadow-2xl border border-emerald-400/40">
            <CentralMartLogo className="h-14 w-14 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#a3e635] text-[#063b1e] text-xs font-black shadow-md">
            ⚡
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>Central Mart</span>
          </h1>
          <p className="text-xs font-bold text-emerald-300 tracking-wider uppercase mt-1">
            Smart Shopping. Better Living.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-inner">
          <Zap className="w-3.5 h-3.5 fill-[#a3e635] text-[#a3e635]" />
          <span>10-15 Min Delivery across Kota</span>
        </div>
      </div>

      {/* Bottom Loading Indicator */}
      <div className="pb-6 flex flex-col items-center space-y-2">
        <div className="h-1.5 w-36 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#a3e635] to-emerald-400 rounded-full animate-pulse w-full" />
        </div>
        <p className="text-[11px] text-emerald-200/70 font-medium">Opening Central Mart Store...</p>
      </div>
    </div>
  );
}

export default AppLaunchSplash;
