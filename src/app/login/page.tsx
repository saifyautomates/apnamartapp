"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ensureCsrf } from "@/lib/api/client";
import { Suspense } from "react";
import Link from "next/link";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  async function requestOtp() {
    setBusy(true);
    setError("");
    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to send OTP");
      if (json.data?.devOtp) setDevOtp(json.data.devOtp);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError("");
    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ phone, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Invalid OTP entered");
      window.dispatchEvent(new Event("cart-updated"));
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8 px-4">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs text-center">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-3xl font-black tracking-tight text-ink">
            blink<span className="text-emerald-700">it</span>
          </span>
          <span className="rounded-full bg-amber-400 text-ink px-2 py-0.5 text-[10px] font-black uppercase">
            10 mins
          </span>
        </div>
        <h1 className="text-lg font-black text-ink mt-2">India&apos;s Last Minute App</h1>
        <p className="mt-1 text-xs text-muted">Log in or sign up to enjoy instant 10-minute grocery deliveries</p>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600">
            {error}
          </p>
        ) : null}

        {step === "phone" ? (
          <div className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1.5">
                Enter Mobile Number
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden focus-within:border-emerald-600 focus-within:bg-white transition">
                <span className="px-3.5 py-3 text-sm font-extrabold text-slate-500 border-r border-slate-200 bg-slate-100/60">
                  +91
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  className="w-full bg-transparent px-3 py-3 text-sm font-bold text-ink placeholder-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={requestOtp}
              disabled={busy || phone.length < 10}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "Sending Code…" : "Continue →"}
            </button>
            <p className="text-[11px] text-muted text-center">
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-ink uppercase tracking-wider">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Edit Number
                </button>
              </div>
              <p className="text-xs text-muted mb-2">We sent a 6-digit OTP to +91 {phone}</p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                className="w-full text-center tracking-widest text-lg font-black rounded-xl border border-slate-200 py-3 text-ink focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            {devOtp ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs text-emerald-900 font-bold">
                Dev Mode Auto-OTP: <span className="text-sm font-black text-emerald-700 tracking-wider">{devOtp}</span>
              </div>
            ) : null}

            <button
              onClick={verify}
              disabled={busy || otp.length !== 6}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-muted">
        Are you a store manager or staff?{" "}
        <Link href="/staff-login" className="font-bold text-emerald-700 hover:underline">
          Staff Login →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center py-10 text-muted">Loading sign in…</p>}>
      <LoginInner />
    </Suspense>
  );
}
