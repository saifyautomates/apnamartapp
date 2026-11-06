"use client";

import { useState } from "react";
import { ensureCsrf } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CentralMartLogo } from "@/components/ui/logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function performLogin(user: string, pass: string) {
    setBusy(true);
    setError("");
    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Login failed");
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(username, password);
  }

  // 1-Click Quick Demo Login for the Store Owner
  async function quickOwnerLogin() {
    setUsername("saif");
    setPassword("AdminPassword123!");
    await performLogin("saif", "AdminPassword123!");
  }

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14 px-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <CentralMartLogo size="lg" showBadge />
        <h1 className="mt-4 text-2xl font-black text-[#1c1c1c] tracking-tight">
          Store Administration Portal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500 font-medium">
          Manage 5,000 FMCG products, live inventory, orders &amp; delivery zones.
        </p>
      </div>

      {/* 1-Click Store Owner Access Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#0c831f] to-[#15803d] p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-base">
            ⚡
          </span>
          <span className="text-sm font-black uppercase tracking-wider text-[#f8cb46]">
            Store Owner Quick Access
          </span>
        </div>
        <p className="text-xs text-emerald-100 font-medium leading-relaxed mb-4">
          Click below to sign in instantly with default store owner credentials (<code className="bg-black/25 px-1.5 py-0.5 rounded text-white font-mono">saif</code>).
        </p>
        <button
          type="button"
          onClick={quickOwnerLogin}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f8cb46] hover:bg-[#fabc22] text-[#1c1c1c] font-black text-sm py-3 px-4 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <span>🚀 1-Click Store Owner Sign In</span>
        </button>
      </div>

      {/* Standard Staff Login Form */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Staff &amp; Manager Credentials
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">RBAC Protected</span>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. saif"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0c831f] focus:ring-2 focus:ring-[#0c831f]/20 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#0c831f] focus:ring-2 focus:ring-[#0c831f]/20 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0c831f] hover:bg-[#0a701a] px-4 py-3 text-sm font-black text-white shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Signing in to Admin…" : "Sign In to Admin Panel"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#0c831f] transition"
        >
          <span>←</span>
          <span>Back to Storefront (Central Mart Home)</span>
        </Link>
      </div>
    </div>
  );
}
