"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Smartphone,
  RotateCw,
  Home,
  ShoppingBag,
  Package,
  Layers,
  ArrowLeft,
  ExternalLink,
  QrCode,
  Check,
  Zap,
  Sparkles,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

type PhoneColor = "midnight" | "green" | "silver" | "blue";
type DeviceScale = 0.85 | 0.95 | 1;

export default function AppSimulatorPage() {
  const [scale, setScale] = useState<DeviceScale>(0.95);
  const [phoneColor, setPhoneColor] = useState<PhoneColor>("midnight");
  const [currentPath, setCurrentPath] = useState<string>("/?appLaunch=1&view=simulator");
  const [time, setTime] = useState("9:41");
  const [isLandscape, setIsLandscape] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live iOS 15 clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch cart count for remote control badge
  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        setCartCount(json.data?.count ?? 0);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const navigateIframe = (path: string) => {
    setCurrentPath(path);
    if (iframeRef.current) {
      iframeRef.current.src = path;
    }
  };

  const openCartDrawer = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "OPEN_CART" }, "*");
    } catch {
      /* ignore */
    }
  };

  const replaySplash = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "TRIGGER_SPLASH" }, "*");
    } catch {
      navigateIframe("/?appLaunch=1&view=simulator");
    }
  };

  const quickAddToCart = async (variantId: string, label: string) => {
    setLoadingAction(label);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, qty: 1 }),
      });
      if (res.ok) {
        await refreshCart();
        // Notify iframe
        iframeRef.current?.contentWindow?.postMessage({ type: "CART_UPDATED" }, "*");
        // Also open cart sheet after adding
        setTimeout(openCartDrawer, 400);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const clearCart = async () => {
    setLoadingAction("clear");
    try {
      await fetch("/api/cart?clearAll=true", { method: "DELETE" });
      await refreshCart();
      iframeRef.current?.contentWindow?.postMessage({ type: "CART_UPDATED" }, "*");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const getPhoneBorderColor = () => {
    switch (phoneColor) {
      case "green":
        return "border-[#143d26] ring-[#0b2918] bg-[#0c2417]";
      case "silver":
        return "border-[#d8d8dc] ring-[#adadb5] bg-[#e5e5ea]";
      case "blue":
        return "border-[#2b4c68] ring-[#1c3347] bg-[#1a2d3e]";
      case "midnight":
      default:
        return "border-[#1a1c20] ring-[#0d0e11] bg-[#101216]";
    }
  };

  const currentHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#0d1117] text-neutral-100 flex flex-col font-sans selection:bg-[#0c831f] selection:text-white">
      {/* Top macOS Monterey / Ventura Style Title Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-800 bg-[#161b22]/95 px-4 py-2.5 backdrop-blur-md shadow-md">
        {/* Left: Window Traffic Lights & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              title="Close & Return to Store"
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f56] text-[#4c0000] hover:opacity-80 transition cursor-pointer"
            >
              <span className="opacity-0 hover:opacity-100 text-[9px] font-bold">×</span>
            </Link>
            <button
              onClick={() => setScale(0.85)}
              title="Scale 85%"
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ffbd2e] text-[#543b00] hover:opacity-80 transition cursor-pointer"
            >
              <span className="opacity-0 hover:opacity-100 text-[9px] font-bold">-</span>
            </button>
            <button
              onClick={() => setScale(1)}
              title="Scale 100%"
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#27c93f] text-[#004d00] hover:opacity-80 transition cursor-pointer"
            >
              <span className="opacity-0 hover:opacity-100 text-[9px] font-bold">+</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs font-bold tracking-tight text-neutral-200">
              iPhone 13 — iOS 15.0 · <span className="text-emerald-400">Central Mart Mobile App</span>
            </div>
          </div>
        </div>

        {/* Center: Device Controls */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          {/* Color Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl bg-neutral-900/80 p-1 border border-neutral-800">
            <button
              onClick={() => setPhoneColor("midnight")}
              className={`h-5 w-5 rounded-full bg-[#18191c] border-2 transition ${
                phoneColor === "midnight" ? "border-emerald-400 scale-110" : "border-neutral-700"
              }`}
              title="Midnight Black"
            />
            <button
              onClick={() => setPhoneColor("green")}
              className={`h-5 w-5 rounded-full bg-[#0d4a2b] border-2 transition ${
                phoneColor === "green" ? "border-emerald-400 scale-110" : "border-neutral-700"
              }`}
              title="Alpine Emerald"
            />
            <button
              onClick={() => setPhoneColor("silver")}
              className={`h-5 w-5 rounded-full bg-[#e2e8f0] border-2 transition ${
                phoneColor === "silver" ? "border-emerald-400 scale-110" : "border-neutral-700"
              }`}
              title="Starlight Silver"
            />
            <button
              onClick={() => setPhoneColor("blue")}
              className={`h-5 w-5 rounded-full bg-[#3b82f6] border-2 transition ${
                phoneColor === "blue" ? "border-emerald-400 scale-110" : "border-neutral-700"
              }`}
              title="Sierra Blue"
            />
          </div>

          {/* Scale Buttons */}
          <div className="flex items-center gap-1 rounded-xl bg-neutral-900/80 p-1 border border-neutral-800">
            <button
              onClick={() => setScale(0.85)}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                scale === 0.85 ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              85%
            </button>
            <button
              onClick={() => setScale(0.95)}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                scale === 0.95 ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              95%
            </button>
            <button
              onClick={() => setScale(1)}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                scale === 1 ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              100%
            </button>
          </div>

          {/* Rotate Orientation */}
          <button
            onClick={() => setIsLandscape(!isLandscape)}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
            title="Rotate Device"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isLandscape ? "Landscape" : "Portrait"}</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan on Real Phone</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>
        </div>
      </header>

      {/* Main Studio Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-4 md:p-8 overflow-y-auto">
        {/* Left / Center: Photorealistic iPhone 13 Device Shell */}
        <div
          className="relative transition-all duration-300 flex items-center justify-center shrink-0"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Hardware Hardware Frame */}
          <div
            className={`relative rounded-[54px] border-[10px] p-2 ring-1 shadow-[0_25px_80px_rgba(0,0,0,0.85)] ${getPhoneBorderColor()}`}
            style={{
              width: isLandscape ? "874px" : "420px",
              height: isLandscape ? "420px" : "874px",
            }}
          >
            {/* Left Hardware Buttons (Volume & Mute) */}
            <div className="absolute -left-[14px] top-28 h-8 w-1 rounded-l-md bg-neutral-600/80" />
            <div className="absolute -left-[14px] top-42 h-14 w-1 rounded-l-md bg-neutral-600/80" />
            <div className="absolute -left-[14px] top-60 h-14 w-1 rounded-l-md bg-neutral-600/80" />

            {/* Right Hardware Power Button */}
            <div className="absolute -right-[14px] top-44 h-20 w-1 rounded-r-md bg-neutral-600/80" />

            {/* Inner Phone Screen */}
            <div
              className="relative h-full w-full overflow-hidden rounded-[44px] bg-black shadow-inner flex flex-col"
              style={{
                width: isLandscape ? "844px" : "390px",
                height: isLandscape ? "390px" : "844px",
              }}
            >
              {/* Dynamic iOS 15 Status Bar & Notch */}
              <div className="relative z-40 flex items-center justify-between px-7 pt-3.5 pb-2 text-white bg-transparent pointer-events-none select-none">
                {/* Status Bar Left: Time */}
                <div className="text-xs font-semibold tracking-tight text-white/95 pl-1">
                  {time}
                </div>

                {/* iPhone 13 TrueDepth Camera Notch */}
                {!isLandscape && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 h-7 w-38 bg-black rounded-b-2xl flex items-center justify-center gap-3">
                    {/* Speaker Earpiece Grille */}
                    <div className="h-1 w-12 rounded-full bg-neutral-800" />
                    {/* Front Camera Lens with Blue Flare */}
                    <div className="h-2.5 w-2.5 rounded-full bg-[#0a1426] ring-1 ring-blue-900/60 relative overflow-hidden">
                      <div className="absolute top-0.5 left-0.5 h-1 w-1 rounded-full bg-blue-400/40" />
                    </div>
                  </div>
                )}

                {/* Status Bar Right: Signal, 5G, Battery */}
                <div className="flex items-center gap-1.5 text-white/95 pr-1">
                  {/* Cellular 5G Bars */}
                  <div className="flex items-end gap-0.5 h-3">
                    <div className="w-0.5 h-1 bg-white rounded-xs" />
                    <div className="w-0.5 h-1.5 bg-white rounded-xs" />
                    <div className="w-0.5 h-2.5 bg-white rounded-xs" />
                    <div className="w-0.5 h-3 bg-white rounded-xs" />
                  </div>
                  <span className="text-[10px] font-black tracking-tighter">5G</span>
                  {/* Wi-Fi Icon */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0012 4zm0 4c3.41 0 6.54 1.28 8.93 3.39L12 19.33 3.07 11.39C5.46 9.28 8.59 8 12 8z" />
                  </svg>
                  {/* Battery Pill with Lightning Bolt */}
                  <div className="flex items-center">
                    <div className="h-3 w-5 rounded-xs border border-white/80 p-0.5 flex items-center bg-transparent">
                      <div className="h-full w-full bg-[#34c759] rounded-2xs flex items-center justify-center">
                        <Zap className="h-2 w-2 fill-black text-black" />
                      </div>
                    </div>
                    <div className="h-1.5 w-0.5 bg-white/80 rounded-r-xs" />
                  </div>
                </div>
              </div>

              {/* Central Mart App Viewport */}
              <div className="relative flex-1 w-full bg-[#fcfcfc] overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={currentPath}
                  title="Central Mart Mobile App"
                  className="h-full w-full border-none select-none bg-white"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
              </div>

              {/* iOS Home Indicator Bar */}
              <div className="relative z-40 h-6 w-full flex items-center justify-center bg-white/95 backdrop-blur-md">
                <button
                  onClick={() => navigateIframe("/?appLaunch=1&view=simulator")}
                  title="Swipe Up to go Home"
                  className="h-1.5 w-36 rounded-full bg-neutral-400 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Studio Remote Control & Screen Shortcuts */}
        <div className="w-full max-w-sm lg:w-96 flex flex-col gap-4">
          {/* Card 1: App Screen Presets */}
          <div className="rounded-3xl bg-[#161b22] border border-neutral-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black">
                  📱
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Screen Presets</h3>
                  <p className="text-[11px] text-neutral-400">Jump directly to any mobile screen</p>
                </div>
              </div>
              <button
                onClick={replaySplash}
                className="flex items-center gap-1 rounded-xl bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 transition cursor-pointer"
                title="Re-run App Launch Splash"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Splash</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigateIframe("/?appLaunch=1&view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition">
                  <Home className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Home Feed</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 2</div>
                </div>
              </button>

              <button
                onClick={() => navigateIframe("/category?view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Categories</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 3</div>
                </div>
              </button>

              <button
                onClick={() => navigateIframe("/category/snacks?view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 group-hover:scale-110 transition">
                  🍿
                </div>
                <div>
                  <div className="font-bold text-white">Snacks Grid</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 4</div>
                </div>
              </button>

              <button
                onClick={() => navigateIframe("/product/lays-classic-salted-potato-chips-52g?view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 group-hover:scale-110 transition">
                  🥔
                </div>
                <div>
                  <div className="font-bold text-white">Lay's PDP</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 5</div>
                </div>
              </button>

              <button
                onClick={() => navigateIframe("/cart?view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Cart Page</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 6</div>
                </div>
              </button>

              <button
                onClick={() => navigateIframe("/orders?view=simulator")}
                className="flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500 hover:bg-neutral-800/80 p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-110 transition">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Live Tracking</div>
                  <div className="text-[10px] text-neutral-400">Mockup Screen 7</div>
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: 1-Click Bottom Sheet Drawer (YouTube Short Feature) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#042c16] via-[#064221] to-[#0a582c] border border-emerald-500/40 p-5 shadow-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-base shadow-inner">
                  🛍️
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Bottom Sheet Cart</h3>
                  <p className="text-[11px] text-emerald-200">As shown in Rahul Codes video</p>
                </div>
              </div>
              <span className="rounded-full bg-[#a3e635] text-[#063b1e] px-2.5 py-0.5 text-[10px] font-black">
                Interactive
              </span>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed">
              In the video, tapping the floating bottom bar smoothly expands the Cart Drawer sheet with promo codes and checkout.
            </p>

            <button
              onClick={openCartDrawer}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-[#063b1e] py-3 text-xs font-black shadow-lg hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#0c831f]" />
              <span>Tap Bottom Cart Bar (Expand Sheet)</span>
            </button>
          </div>

          {/* Card 3: Quick Test Cart Controller */}
          <div className="rounded-3xl bg-[#161b22] border border-neutral-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#a3e635]" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Live Cart Injection
                </h3>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Cart Items: <strong className="text-white">{cartCount}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={loadingAction !== null}
                onClick={() =>
                  quickAddToCart(
                    "a1000000-0000-0000-0000-000000000001",
                    "lays"
                  )
                }
                className="flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/60 p-2.5 text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer"
              >
                <span>+ Lay's Classic</span>
                <span className="text-emerald-400 font-black">₹20</span>
              </button>

              <button
                disabled={loadingAction !== null}
                onClick={() =>
                  quickAddToCart(
                    "a2000000-0000-0000-0000-000000000002",
                    "coke"
                  )
                }
                className="flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/60 p-2.5 text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer"
              >
                <span>+ Coca-Cola</span>
                <span className="text-emerald-400 font-black">₹60</span>
              </button>
            </div>

            <button
              disabled={loadingAction !== null}
              onClick={clearCart}
              className="w-full text-center py-2 text-[11px] font-bold text-neutral-400 hover:text-red-400 transition cursor-pointer"
            >
              Clear Cart Data
            </button>
          </div>

          {/* Card 4: Production Quality Badges */}
          <div className="rounded-2xl bg-[#161b22]/60 border border-neutral-800/80 p-4 flex items-center justify-between text-neutral-400 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full E2E Database & Cart Sync</span>
            </div>
            <Link
              href="/admin"
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code Modal to Test on Physical Phone */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#161b22] border border-neutral-700 p-6 shadow-2xl text-center space-y-4 text-white"
          >
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <QrCode className="h-6 w-6" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Scan with your Phone</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Open Camera app on your iPhone or Android to test Central Mart natively.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  currentHost
                )}`}
                alt="Central Mart QR Code"
                width={180}
                height={180}
                className="h-44 w-44 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
              <span className="truncate text-neutral-300 max-w-[200px]">{currentHost}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentHost);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

