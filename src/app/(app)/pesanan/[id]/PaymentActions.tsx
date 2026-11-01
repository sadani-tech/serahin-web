"use client";

import { useState } from "react";
import { verifyPayment, deletePayment, syncGatewayPaymentAsSeller, verifyGatewayPaymentManually, expireGatewayPaymentAsSeller } from "../actions";
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
  gateway?: { orderId: string; canSync: boolean; gatewayStatus?: string | null };
}) {
  const { confirm, prompt } = useConfirm();
  const { pending, run } = useApiTransition();
  const [message, setMessage] = useState<string>();

  if (gateway) {
    const awaiting = status === "MENUNGGU_VERIFIKASI";
    // Dibayar setelah tagihan ditutup: belum dihitung, Seller memutuskan.
    const paidAfterClose = status === "KEDALUWARSA" && gateway.gatewayStatus === "PAID";
    if (!gateway.canSync || (!awaiting && !paidAfterClose)) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {paidAfterClose && (
          <p className="w-full text-xs font-semibold text-rose-700">
            Dana masuk setelah tagihan ditutup. Verifikasi bila dipakai untuk tagihan ini, atau refund ke Buyer.
          </p>
        )}
        {awaiting && <button
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
        </button>}
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
        {awaiting && (
          <button
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: "Tandai tagihan gateway kedaluwarsa?",
                description:
                  "Lakukan bila di dashboard GDC tagihan ini sudah Expired. Status penyedia dicek dulu; setelah ditandai, Buyer dapat membayar lewat transfer manual.",
                confirmLabel: "Tandai kedaluwarsa",
              });
              if (!ok) return;
              run(async () => {
                const res = await expireGatewayPaymentAsSeller(gateway.orderId, paymentId);
                if (res.error) setMessage(res.error);
              });
            }}
            className="rounded-md border border-sand-300 px-2.5 py-1 text-xs font-medium text-sand-700 hover:bg-sand-50 disabled:opacity-50"
          >
            Tandai kedaluwarsa
          </button>
        )}
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
