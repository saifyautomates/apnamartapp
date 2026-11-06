"use client";

import { useState } from "react";
import { ensureCsrf } from "@/components/shop";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const token = await ensureCsrf();
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Login failed");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold">Staff login</h1>
      <p className="mt-1 text-sm text-muted">Store staff only. Customers sign in from the storefront.</p>
      {error ? <p className="mt-3 rounded bg-sale/10 px-3 py-2 text-sm text-sale">{error}</p> : null}
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" required />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2" required />
        </label>
        <button disabled={busy} className="w-full rounded-lg bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
