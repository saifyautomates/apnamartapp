"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ensureCsrf } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import Link from "next/link";
import { CentralMartLogo } from "@/components/ui/logo";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/";

  // Auth Mode: "phone" (Indian Mobile OTP) or "email" (Supabase Auth)
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");

  // Phone OTP State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devOtp, setDevOtp] = useState("");

  // Email / Supabase State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Common State
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // 1. Phone OTP Handlers
  async function requestOtp() {
    setBusy(true);
    setError("");
    setSuccessMsg("");
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

  async function verifyOtp() {
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

  // 2. Supabase Email / Password Handler
  async function handleSupabaseEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpErr) throw signUpErr;

        if (data.session) {
          // Sync with local database
          await syncSupabaseSession(data.session.access_token);
        } else {
          setSuccessMsg("Account created! Check your email to confirm your account or sign in.");
          setIsSignUp(false);
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;

        if (data.session) {
          await syncSupabaseSession(data.session.access_token);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  // 3. Supabase Google OAuth Handler
  async function handleGoogleOAuth() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google login failed";
      setError(message);
      setBusy(false);
    }
  }

  // Helper to sync Supabase session into platform Prisma DB & Cookies
  async function syncSupabaseSession(accessToken: string) {
    const res = await fetch("/api/auth/supabase/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error?.message ?? "Session sync failed");
    }
    const target = json?.data?.user?.isAdmin && next === "/" ? "/admin" : next;
    window.dispatchEvent(new Event("cart-updated"));
    router.push(target);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-8 px-4">
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm text-center">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <CentralMartLogo size="md" showBadge />
        </div>
        <h1 className="text-xl font-black text-[#1c1c1c] tracking-tight">
          Kota&apos;s Dedicated Online Supermarket
        </h1>
        <p className="mt-1 text-xs text-neutral-500 font-medium">
          Log in or sign up for 100% genuine FMCG essentials delivered across Kota with reliable Same-Day Delivery
        </p>

        {/* Auth Mode Toggle Tabs (Phone vs Supabase Email) */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setError("");
            }}
            className={`rounded-xl py-2 transition cursor-pointer ${
              authMode === "phone"
                ? "bg-white text-[#0c831f] shadow-xs font-black"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            📱 Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("email");
              setError("");
            }}
            className={`rounded-xl py-2 transition cursor-pointer ${
              authMode === "email"
                ? "bg-white text-[#0c831f] shadow-xs font-black"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            ✉️ Email (Supabase)
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600 text-left">
            {error}
          </p>
        ) : null}

        {successMsg ? (
          <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 text-left">
            {successMsg}
          </p>
        ) : null}

        {/* 1. Phone OTP Auth Section */}
        {authMode === "phone" && (
          <>
            {step === "phone" ? (
              <div className="mt-5 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-1.5">
                    Enter Mobile Number
                  </label>
                  <div className="flex items-center rounded-xl border border-neutral-300 bg-neutral-50/70 overflow-hidden focus-within:border-[#0c831f] focus-within:bg-white transition">
                    <span className="px-3.5 py-3 text-sm font-extrabold text-neutral-500 border-r border-neutral-200 bg-neutral-100/60">
                      +91
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      inputMode="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit number"
                      className="w-full bg-transparent px-3 py-3 text-sm font-bold text-[#1c1c1c] placeholder-neutral-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={busy || phone.length < 10}
                  className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-3.5 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Sending Code…" : "Continue with OTP →"}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4 text-left">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-[#1c1c1c] uppercase tracking-wider">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="text-xs font-bold text-[#0c831f] hover:underline cursor-pointer"
                    >
                      Edit Number
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">
                    We sent a 6-digit OTP to +91 {phone}
                  </p>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-widest text-lg font-black rounded-xl border border-neutral-300 py-3 text-[#1c1c1c] focus:border-[#0c831f] focus:outline-hidden"
                  />
                </div>

                {devOtp ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs text-emerald-900 font-bold">
                    Dev Auto-OTP:{" "}
                    <span className="text-sm font-black text-[#0c831f] tracking-wider">
                      {devOtp}
                    </span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={busy || otp.length !== 6}
                  className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-3.5 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? "Verifying…" : "Verify & Continue"}
                </button>
              </div>
            )}
          </>
        )}

        {/* 2. Supabase Email Auth Section */}
        {authMode === "email" && (
          <form onSubmit={handleSupabaseEmailAuth} className="mt-5 space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50/70 px-3.5 py-2.5 text-sm font-medium text-[#1c1c1c] focus:border-[#0c831f] focus:bg-white focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#1c1c1c] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50/70 px-3.5 py-2.5 text-sm font-medium text-[#1c1c1c] focus:border-[#0c831f] focus:bg-white focus:outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] text-white py-3 text-center text-sm font-black shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Processing…" : isSignUp ? "Create Supabase Account" : "Sign In with Email"}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-xs font-bold text-[#0c831f] hover:underline cursor-pointer"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "New to Central Mart? Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-bold text-neutral-400">or continue with</span>
          </div>
        </div>

        {/* 3. Google OAuth via Supabase */}
        <button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 py-2.5 px-4 text-xs sm:text-sm font-bold text-[#1c1c1c] shadow-xs transition active:scale-[0.99] cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-4 text-[11px] text-neutral-400">
          By signing in, you agree to Central Mart Terms of Service & Privacy Policy.
        </p>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-500">
        Are you a store manager or staff?{" "}
        <Link href="/staff-login" className="font-bold text-[#0c831f] hover:underline">
          Staff Portal Login →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center py-10 text-neutral-400">Loading sign in…</p>}>
      <LoginInner />
    </Suspense>
  );
}
