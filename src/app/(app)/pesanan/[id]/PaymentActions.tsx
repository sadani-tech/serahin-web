"use client";

import { useState } from "react";
import { verifyPayment, deletePayment, syncGatewayPaymentAsSeller, verifyGatewayPaymentManually } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useApiTransition } from "@/hooks/useNavLoading";
import type { PaymentVerification } from "@/lib/types";

export function PaymentActions({
  paymentId,
  status,
  gateway,
}: {
  paymentId: string;
  status: PaymentVerification;
  /** Diisi untuk pembayaran gateway: diverifikasi lewat sinkronisasi provider, bukan manual. */
  gateway?: { orderId: string; canSync: boolean };
}) {
  const { confirm, prompt } = useConfirm();
  const { pending, run } = useApiTransition();
  const [message, setMessage] = useState<string>();

  if (gateway) {
    if (!gateway.canSync || status !== "MENUNGGU_VERIFIKASI") return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={pending}
          onClick={() =>
            run(async () => {
              const res = await syncGatewayPaymentAsSeller(gateway.orderId, paymentId);
              setMessage(
                res.error ??
                  (res.gatewayStatus === "PENDING"
                    ? "Penyedia pembayaran masih melaporkan PENDING."
                    : `Status gateway: ${res.gatewayStatus ?? "-"}`),
              );
            })
          }
          className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          Cek status gateway
        </button>
        <button
          disabled={pending}
          onClick={async () => {
            const ok = await confirm({
              title: "Verifikasi manual pembayaran gateway?",
              description:
                "Lakukan hanya bila dana sudah dipastikan masuk di dashboard GDC. Pembayaran akan ditandai lunas dan tidak disinkronkan ulang.",
              confirmLabel: "Verifikasi",
            });
            if (!ok) return;
            run(async () => {
              const res = await verifyGatewayPaymentManually(gateway.orderId, paymentId);
              if (res.error) setMessage(res.error);
            });
          }}
          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Verifikasi manual
        </button>
        {message && <p className="w-full text-xs font-semibold text-amber-800">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "TERVERIFIKASI" && (
        <button
          disabled={pending}
          onClick={() => run(() => verifyPayment(paymentId, "TERVERIFIKASI"))}
          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Verifikasi
        </button>
      )}
      {status !== "DITOLAK" && (
        <button
          disabled={pending}
          onClick={async () => {
            const alasan = await prompt({
              title: "Tolak pembayaran",
              label: "Alasan penolakan pembayaran",
            });
            if (!alasan) return;
            run(() => verifyPayment(paymentId, "DITOLAK", undefined, alasan));
          }}
          className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-400 disabled:opacity-50"
        >
          Tolak
        </button>
      )}
      <button
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({
            title: "Hapus catatan pembayaran ini?",
            description: "Catatan pembayaran akan dihapus permanen.",
            confirmLabel: "Hapus",
          });
          if (ok) run(() => deletePayment(paymentId));
        }}
        className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
      >
        Hapus
      </button>
    </div>
  );
}
