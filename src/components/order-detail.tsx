"use client";

import { useState } from "react";
import { api } from "@/components/shop";
import { useRouter } from "next/navigation";

export default function OrderDetailClient({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cancellable = ["PENDING_PAYMENT", "PLACED", "CONFIRMED"].includes(status);

  async function cancel() {
    if (!window.confirm("Cancel this order? Items will be released back to stock.")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({}) });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  async function reorder() {
    setBusy(true);
    setError("");
    try {
      const data = await api(`/api/orders/${orderId}/reorder`, { method: "POST", body: JSON.stringify({}) });
      if (data.unavailable?.length > 0) {
        alert(`Some items were unavailable and not added: ${data.unavailable.join(", ")}`);
      }
      window.dispatchEvent(new Event("cart-updated"));
      router.push("/cart");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {cancellable ? (
        <button
          onClick={cancel}
          disabled={busy}
          className="flex-1 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-4 py-3 text-xs font-black shadow-xs transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "Cancelling…" : "Cancel Order"}
        </button>
      ) : null}
      <button
        onClick={reorder}
        disabled={busy}
        className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-xs font-black shadow-md transition active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? "Adding to Cart…" : "Reorder Entire Order 🛒"}
      </button>
      {error ? <p className="w-full text-xs text-red-600 font-bold">{error}</p> : null}
    </div>
  );
}
