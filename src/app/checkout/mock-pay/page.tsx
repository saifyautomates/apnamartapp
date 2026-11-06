"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Suspense } from "react";

function MockPayInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId") ?? "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(success: boolean) {
    setBusy(true);
    setError("");
    try {
      await api("/api/payments/mock-confirm", { method: "POST", body: JSON.stringify({ orderId, success }) });
      router.push(`/orders/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Mock payment gateway</h1>
      <p className="mt-2 text-sm text-muted">
        Development-only stand-in for a real payment gateway. In production this page is replaced by the gateway&apos;s hosted checkout.
      </p>
      <p className="mt-3 text-sm">Order: <strong>{orderId}</strong></p>
      {error ? <p className="mt-3 rounded bg-sale/10 px-3 py-2 text-sm text-sale">{error}</p> : null}
      <div className="mt-4 space-y-2">
        <button onClick={() => confirm(true)} disabled={busy} className="w-full rounded-lg bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-50">
          Pay successfully
        </button>
        <button onClick={() => confirm(false)} disabled={busy} className="w-full rounded-lg border border-line bg-white px-4 py-3 font-bold disabled:opacity-50">
          Simulate payment failure
        </button>
      </div>
    </div>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <MockPayInner />
    </Suspense>
  );
}
