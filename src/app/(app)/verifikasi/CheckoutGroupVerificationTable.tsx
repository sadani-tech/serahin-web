"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProofViewerButton } from "@/components/ProofViewerButton";
import { ToastFeedback, useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { verifyCheckoutGroup, rejectCheckoutGroup } from "./actions";

export type CheckoutGroupVerificationRow = {
  id: string;
  status: string;
  totalAmountTarget: number;
  paymentProofFile: string | null;
  submittedAt: string | null;
  orders: {
    orderId: string;
    publicToken: string;
    campaignTitle: string;
    status: string;
    allocatedAmount: number;
  }[];
};

export function CheckoutGroupVerificationTable({ rows }: { rows: CheckoutGroupVerificationRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();
  const { confirm, prompt } = useConfirm();

  async function onVerify(row: CheckoutGroupVerificationRow) {
    setError("");
    const ok = await confirm({
      title: `Verifikasi checkout gabungan ${rupiah(row.totalAmountTarget)}?`,
      description: `${row.orders.length} Order (${row.orders.map((o) => o.campaignTitle).join(", ")}) akan ditandai lunas/DP sesuai alokasinya masing-masing.`,
      confirmLabel: "Verifikasi",
      variant: "primary",
    });
    if (!ok) return;
    setBusyId(row.id);
    const result = await verifyCheckoutGroup(row.id);
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success("Checkout gabungan terverifikasi — seluruh Order anggota diperbarui.");
    router.refresh();
  }

  async function onReject(row: CheckoutGroupVerificationRow) {
    setError("");
    const alasan = await prompt({ title: "Tolak checkout gabungan", label: "Alasan penolakan (terlihat oleh Buyer)" });
    if (!alasan) return;
    setBusyId(row.id);
    const result = await rejectCheckoutGroup(row.id, alasan);
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success("Checkout gabungan ditolak.");
    router.refresh();
  }

  return (
    <div>
      {error && <div className="p-4"><ToastFeedback error={error} /></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-sand-500">
            <th className="px-4 py-3 font-medium">Rincian Batch PO</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Bukti</th>
            <th className="px-4 py-3 font-medium">Menunggu</th>
            <th className="px-4 py-3 font-medium">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-sand-100">{rows.map((row) => (
            <tr key={row.id} className="hover:bg-sand-50 align-top">
              <td className="px-4 py-3">
                <ul className="space-y-1">
                  {row.orders.map((o) => (
                    <li key={o.orderId}>
                      <Link href={`/pesanan/${o.orderId}`} className="font-bold text-sand-900 hover:underline">{o.campaignTitle}</Link>
                      <span className="ml-1 text-xs text-sand-500">— {rupiah(o.allocatedAmount)}</span>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 font-extrabold text-sand-900">{rupiah(row.totalAmountTarget)}</td>
              <td className="px-4 py-3">{row.paymentProofFile ? <ProofViewerButton url={row.paymentProofFile} className="font-bold text-brand-700 hover:underline" /> : <span className="text-rose-600">Tidak ada</span>}</td>
              <td className="px-4 py-3 text-xs text-sand-600">{row.submittedAt ? waitingSince(row.submittedAt) : "-"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button disabled={busyId === row.id} onClick={() => onVerify(row)} className="rounded-full bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Verifikasi</button>
                  <button disabled={busyId === row.id} onClick={() => onReject(row)} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Tolak</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function rupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function waitingSince(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}
