"use client";

import React, { useState } from "react";
import { useDelivery, ShoppingMode } from "@/lib/delivery-context";
import {
  Zap,
  Store,
  QrCode,
  MapPin,
  Clock,
  Phone,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export interface ShoppingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
}

export function ShoppingModeModal({
  isOpen,
  onClose,
  onOpenScanner,
}: ShoppingModeModalProps) {
  const {
    shoppingMode,
    setShoppingMode,
    storeInfo,
    activeLocation,
    setActiveLocation,
  } = useDelivery();

  const [pincodeInput, setPincodeInput] = useState(activeLocation.pincode || "324001");
  const [serviceable, setServiceable] = useState<boolean | null>(true);

  if (!isOpen) return null;

  const handleSelectMode = (mode: ShoppingMode) => {
    setShoppingMode(mode);
    onClose();
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    // Kota pincodes are 324001 through 324010
    const isKota = pin.startsWith("3240") || pin.startsWith("324");
    setServiceable(isKota);
    if (isKota) {
      setActiveLocation({
        pincode: pin,
        zoneName: `Kota (${pin})`,
        address: `Sector ${pin.slice(-2) || "1"}, Kota, Rajasthan - ${pin}`,
        estimatedTime: "15–30 Mins",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#032e16] via-[#063b1e] to-[#0a582c] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#a3e635]">
                Central Mart Hybrid Commerce
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Choose How You Want to Shop
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-emerald-200/90 font-medium">
            Order online with 15–30 min delivery, pick up in store, or scan &amp; go while walking our aisles.
          </p>
        </div>

        {/* Modal Body - 3 Shopping Modes */}
        <div className="overflow-y-auto p-5 space-y-3.5 divide-y divide-neutral-100">
          {/* Mode 1: Doorstep Delivery */}
          <div
            onClick={() => handleSelectMode("DELIVERY")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              shoppingMode === "DELIVERY"
                ? "border-[#0c831f] bg-emerald-50/60 ring-2 ring-[#0c831f]/20 shadow-xs"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0c831f] text-white shadow-xs shrink-0">
                  <Zap className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#1c1c1c]">
                      Doorstep Delivery
                    </h3>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5">
                      15–30 Mins
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Express 15–30 min delivery straight to your doorstep across Kota.
                  </p>
                </div>
              </div>
              {shoppingMode === "DELIVERY" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Delivery Details & Pincode Checker */}
            <div className="mt-3 pt-3 border-t border-emerald-200/50 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-neutral-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0c831f]" />
                  <span>Delivering to: <strong className="text-[#1c1c1c]">{activeLocation.zoneName || "Kota, Rajasthan"}</strong></span>
                </span>
                <span className="font-bold text-[#0c831f]">FREE over ₹199</span>
              </div>

              {shoppingMode === "DELIVERY" && (
                <form
                  onSubmit={handleCheckPincode}
                  onClick={(e) => e.stopPropagation()}
                  className="flex gap-2 mt-1"
                >
                  <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Kota PIN (e.g. 324001)"
                    className="flex-1 rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-mono font-bold text-[#1c1c1c] focus:border-[#0c831f] focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0c831f] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#0a701a] transition cursor-pointer"
                  >
                    Check PIN
                  </button>
                </form>
              )}

              {serviceable === true && (
                <p className="text-[11px] font-bold text-[#0c831f] flex items-center gap-1">
                  <span>✓</span>
                  <span>Instant 15-30 min delivery available at your address!</span>
                </p>
              )}
              {serviceable === false && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <span>✕</span>
                  <span>Delivery outside Kota limits. Choose Store Pickup instead!</span>
                </p>
              )}
            </div>
          </div>

          {/* Mode 2: Store Pickup */}
          <div
            onClick={() => handleSelectMode("PICKUP")}
            className={`pt-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
              shoppingMode === "PICKUP"
                ? "border-[#0c831f] bg-emerald-50/60 ring-2 ring-[#0c831f]/20 shadow-xs"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-xs shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#1c1c1c]">
                      Store Pickup (Click &amp; Collect)
                    </h3>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5">
                      Zero Fees · Ready in 15m
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Order online, skip billing queues, and collect packed groceries at store counter.
                  </p>
                </div>
              </div>
              {shoppingMode === "PICKUP" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Store Information */}
            <div className="mt-3 pt-3 border-t border-amber-200/50 space-y-1.5 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5 font-bold text-[#1c1c1c]">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>{storeInfo.name}</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-5">
                {storeInfo.address}, {storeInfo.city} - {storeInfo.pincode}
              </p>
              <div className="flex items-center gap-4 text-[11px] font-medium pl-5 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Clock className="w-3 h-3" />
                  <span>{storeInfo.hours}</span>
                </span>
                <span className="flex items-center gap-1 text-neutral-500">
                  <Phone className="w-3 h-3" />
                  <span>{storeInfo.phone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mode 3: In-Store Shopping (Scan & Go) */}
          <div
            onClick={() => {
              handleSelectMode("IN_STORE");
              if (onOpenScanner) onOpenScanner();
            }}
            className={`pt-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
              shoppingMode === "IN_STORE"
                ? "border-[#0c831f] bg-emerald-50/60 ring-2 ring-[#0c831f]/20 shadow-xs"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#1c1c1c]">
                      In-Store Shopping (Scan &amp; Go)
                    </h3>
                    <span className="rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5">
                      Physical Store
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Walking in our 80 Feet Road Supermarket? Scan barcodes to check prices, locate aisles &amp; self-checkout.
                  </p>
                </div>
              </div>
              {shoppingMode === "IN_STORE" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c831f] text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* In-Store Benefits */}
            <div className="mt-3 pt-3 border-t border-indigo-200/50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-500 font-medium">
                📍 8 Aisles categorized with live shelf stock
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMode("IN_STORE");
                  if (onOpenScanner) onOpenScanner();
                }}
                className="inline-flex items-center gap-1 text-xs font-black text-indigo-700 hover:underline"
              >
                <span>Open Scanner</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0c831f]" />
            <span>100% Genuine FMCG Stock Guaranteed</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-2 font-black transition cursor-pointer active:scale-95"
          >
            Confirm Mode
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingModeModal;
