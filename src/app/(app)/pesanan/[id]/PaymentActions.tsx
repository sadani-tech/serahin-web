"use client";

import { verifyPayment, deletePayment } from "../actions";

export function PaymentActions({
  paymentId,
  status,
}: {
  paymentId: string;
  status: "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "TERVERIFIKASI" && (
        <button
          onClick={() => verifyPayment(paymentId, "TERVERIFIKASI")}
          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Verifikasi
        </button>
      )}
      {status !== "DITOLAK" && (
        <button
          onClick={() => verifyPayment(paymentId, "DITOLAK")}
          className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-400"
        >
          Tolak
        </button>
      )}
      <button
        onClick={() => {
          if (confirm("Hapus catatan pembayaran ini?")) deletePayment(paymentId);
        }}
        className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
      >
        Hapus
      </button>
    </div>
  );
}
