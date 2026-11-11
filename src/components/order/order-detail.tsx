"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

export interface OrderDetailProps {
  orderId: string;
  status: string;
}

const CANCEL_REASONS = [
  "Placed order by mistake",
  "Incorrect delivery address",
  "Forgot to add items to cart",
  "Delivery time is too long",
  "Found better price elsewhere",
  "Other reason",
];

export function OrderDetailClient({ orderId, status: initialStatus }: OrderDetailProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  const cancellable = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PREPARING"].includes(currentStatus);
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "REFUND_PENDING" || currentStatus === "REFUNDED";

  async function handleConfirmCancel() {
    setBusy(true);
    setError("");
    const reasonToSend = selectedReason === "Other reason" && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    try {
      await api(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reasonToSend }),
      });
      setCurrentStatus("CANCELLED");
      setShowCancelModal(false);
      setSuccessMsg("Order cancelled successfully. Reserved inventory has been restored.");
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
      const data = await api<{ unavailable?: string[] }>(`/api/orders/${orderId}/reorder`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (data?.unavailable && data.unavailable.length > 0) {
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
    <div className="space-y-3">
      {successMsg ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {isCancelled ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p>This order has been cancelled.</p>
              <p className="text-[11px] font-normal text-red-600 mt-0.5">
                {currentStatus === "REFUND_PENDING" || currentStatus === "REFUNDED"
                  ? "Refund has been processed / credited to original payment source."
                  : "No amount was deducted (Cash on Delivery)."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        {cancellable ? (
          <button
            id="cancel-order-trigger-btn"
            onClick={() => setShowCancelModal(true)}
            disabled={busy}
            className="flex-1 rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-4 py-3 text-xs font-black shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            Cancel Order
          </button>
        ) : null}
        <button
          id="reorder-btn"
          onClick={reorder}
          disabled={busy}
          className="flex-1 rounded-2xl bg-[#0c831f] hover:bg-[#0a701a] text-white px-5 py-3 text-xs font-black shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{busy ? "Adding to Cart…" : "Reorder Entire Order"}</span>
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1c1c1c]">Cancel Order</h3>
                <p className="text-xs text-neutral-500">Please choose a reason for cancellation</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    selectedReason === r
                      ? "border-red-500 bg-red-50/50 text-red-950"
                      : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-red-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {selectedReason === "Other reason" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us what went wrong..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs focus:border-red-500 focus:outline-hidden"
                />
              )}
            </div>

            <p className="text-[11px] text-neutral-500">
              ⚡ Order cancellation will immediately restore items to stock and process eligible refunds.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
              <button
                id="cancel-modal-dismiss-btn"
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                id="confirm-cancel-order-btn"
                type="button"
                onClick={handleConfirmCancel}
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {busy ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailClient;

