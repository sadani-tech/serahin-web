"use client";
import { useState, useTransition } from "react";
import { setSellerPaymentGateway } from "../../management-actions";

export function PaymentGatewayToggle({ sellerId, initialEnabled }: { sellerId: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const next = !enabled;
    setError("");
    setEnabled(next);
    startTransition(async () => {
      try {
        await setSellerPaymentGateway(sellerId, next);
      } catch {
        setEnabled(!next);
        setError("Gagal mengubah status. Coba lagi.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-sand-900">Payment Gateway</p>
          <p className="mt-0.5 text-xs text-sand-500">
            Izinkan Seller ini menerima pembayaran otomatis (VA/QRIS/dll). Buyer tetap bisa transfer manual bila ini nonaktif.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={toggle}
          className={`relative min-h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${enabled ? "bg-brand-600" : "bg-sand-300"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <p className={`mt-2 text-xs font-bold ${enabled ? "text-brand-700" : "text-sand-500"}`}>{enabled ? "Aktif" : "Nonaktif"}</p>
      {error && <p className="mt-1 text-xs font-bold text-rose-700">{error}</p>}
    </div>
  );
}
