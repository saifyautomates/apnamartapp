"use client";

import { useEffect, useState } from "react";
import { ensureCsrf } from "@/lib/api/client";

export function openLoginModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("open-login-modal"));
  }
}

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setStep("phone");
      setError("");
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-login-modal", handleOpen);
    window.addEventListener("close-login-modal", handleClose);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("open-login-modal", handleOpen);
      window.removeEventListener("close-login-modal", handleClose);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to send OTP");
      if (json.data?.devOtp) setDevOtp(json.data.devOtp);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Invalid OTP entered");

      // Notify app of auth change
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      setIsOpen(false);
      window.location.reload(); // Refresh session state smoothly
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  // 1-Click Instant Demo Login for Kota Customer
  async function handleInstantTestLogin() {
    setPhone("9876543210");
    setBusy(true);
    setError("");
    try {
      const token = await ensureCsrf();
      const reqRes = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone: "9876543210" }),
      });
      const reqJson = await reqRes.json();
      const code = reqJson.data?.devOtp ?? "123456";

      const verRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone: "9876543210", code }),
      });
      if (!verRes.ok) throw new Error("Instant login failed");

      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Instant login failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal / Bottom Sheet */}
      <aside
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] w-full flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl z-50 animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 overflow-hidden"
        aria-label="Customer Login"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white cursor-grab">
          <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 bg-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#0c831f] text-sm font-black">
              ⚡
            </span>
            <div>
              <h3 className="text-base font-black text-[#1c1c1c] leading-tight">
                {step === "phone" ? "Login to Central Mart" : "Verify Phone"}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">Kota Online FMCG Supermarket</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border border-neutral-200 bg-[#fafafa] overflow-hidden focus-within:border-[#0c831f] focus-within:bg-white transition">
                  <span className="px-3.5 py-3 text-sm font-black text-neutral-500 border-r border-neutral-200 bg-neutral-100/60 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit mobile number"
                    className="flex-1 px-3.5 py-3 text-sm font-bold text-[#1c1c1c] placeholder-neutral-400 focus:outline-none bg-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || phone.replace(/\D/g, "").length !== 10}
                className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] disabled:opacity-50 text-white py-3 text-sm font-black transition active:scale-98 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span>Continue with OTP →</span>
                )}
              </button>

              {/* 1-Click Instant Demo Login Option */}
              <div className="pt-2 border-t border-neutral-100 text-center">
                <button
                  type="button"
                  onClick={handleInstantTestLogin}
                  disabled={busy}
                  className="w-full rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1c1c1c] py-2.5 text-xs font-bold transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>1-Click Test Customer Login (Instant)</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
                    Enter Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="text-[11px] font-bold text-[#0c831f] hover:underline cursor-pointer"
                  >
                    Edit Phone
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-widest text-lg font-black rounded-xl border border-neutral-200 bg-[#fafafa] px-3 py-3 text-[#1c1c1c] focus:bg-white focus:border-[#0c831f] focus:outline-none transition"
                  autoFocus
                />
              </div>

              {devOtp ? (
                <div className="rounded-xl bg-[#e8f5e9] border border-[#0c831f]/20 p-2.5 text-xs text-[#0c831f] font-bold flex items-center justify-between">
                  <span>Test OTP: <strong>{devOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(devOtp);
                    }}
                    className="underline text-[11px] uppercase font-black cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy || !otp.trim()}
                className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] disabled:opacity-50 text-white py-3 text-sm font-black transition active:scale-98 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span>Verify &amp; Continue →</span>
                )}
              </button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

export default LoginModal;

