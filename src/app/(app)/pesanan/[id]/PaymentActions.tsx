"use client";

import { verifyPayment, deletePayment } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useApiTransition } from "@/hooks/useNavLoading";
import type { PaymentVerification } from "@/lib/types";

export function PaymentActions({
  paymentId,
  status,
}: {
  paymentId: string;
  status: PaymentVerification;
}) {
  const { confirm } = useConfirm();
  const { pending, run } = useApiTransition();

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
          onClick={() => run(() => verifyPayment(paymentId, "DITOLAK"))}
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
