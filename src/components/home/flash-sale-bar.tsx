"use client";

import { useEffect, useState } from "react";
import { StoreOffer } from "@/lib/offers";
import { Sparkles, Check, Copy, X } from "lucide-react";

export function FlashSaleBar({ initialOffers }: { initialOffers?: StoreOffer[] }) {
  const [offers, setOffers] = useState<StoreOffer[]>(initialOffers || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  // Load active offers if not provided
  useEffect(() => {
    if (!initialOffers || initialOffers.length === 0) {
      fetch("/api/offers")
        .then((r) => r.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data)) {
            setOffers(json.data);
          }
        })
        .catch(() => {});
    }
  }, [initialOffers]);

  const currentOffer = offers[activeIdx] || offers[0];

  useEffect(() => {
    if (!currentOffer?.endsAt) return;

    const tick = () => {
      const diff = new Date(currentOffer.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentOffer?.endsAt]);

  if (!currentOffer || dismissed || timeLeft.expired) return null;

  const handleCopyCode = () => {
    if (!currentOffer.code) return;
    try {
      navigator.clipboard.writeText(currentOffer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <aside
      aria-label="Flash Sale Announcement"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#c2410c] text-white shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 text-xs">
        {/* Left: Badge & Offer Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{currentOffer.badgeText?.replace(/^⚡\s*/, "") || "Flash Offer"}</span>
          </span>

          <p className="font-bold truncate text-[11px] sm:text-xs">
            <span>{currentOffer.title}</span>
            {currentOffer.minOrderValue > 0 && (
              <span className="hidden md:inline font-normal text-white/80 ml-1">
                (Min order ₹{currentOffer.minOrderValue})
              </span>
            )}
          </p>
        </div>

        {/* Center / Right: Live Countdown Timer & Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Countdown Clock */}
          <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg font-mono font-bold tabular-nums text-[11px] sm:text-xs shadow-inner">
            <span className="text-[10px] text-white/70 font-sans font-semibold uppercase hidden sm:inline mr-1">
              Ends in
            </span>
            <span className="text-amber-300 tracking-wider">
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>

          {/* Promo Code Copy Pill */}
          {currentOffer.code && (
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#991b1b] hover:bg-neutral-100 transition shadow-xs cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>{currentOffer.code}</span>
                </>
              )}
            </button>
          )}

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/70 hover:text-white transition cursor-pointer active:scale-90"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default FlashSaleBar;

