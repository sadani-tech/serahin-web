"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProofViewerButton } from "@/components/ProofViewerButton";
import { ToastFeedback, useToast } from "@/components/Toast";
import { verifyCheckoutGroup, rejectCheckoutGroup } from "./actions";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";

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
  const [reviewRow, setReviewRow] = useState<CheckoutGroupVerificationRow | null>(null);
  const [decision, setDecision] = useState<"VERIFY" | "REJECT">("VERIFY");
  const [reason, setReason] = useState("");
  const toast = useToast();
  const router = useRouter();
  async function submitReview() {
    if (!reviewRow || (decision === "REJECT" && !reason.trim())) return;
    setError("");
    setBusyId(reviewRow.id);
    const result = decision === "VERIFY" ? await verifyCheckoutGroup(reviewRow.id) : await rejectCheckoutGroup(reviewRow.id, reason.trim());
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success(decision === "VERIFY" ? "Checkout gabungan terverifikasi." : "Checkout gabungan ditolak.");
    setReviewRow(null);
    router.refresh();
  }

  function openReview(row: CheckoutGroupVerificationRow) { setReviewRow(row); setDecision("VERIFY"); setReason(""); setError(""); }

  return (
    <div>
      {error && <div className="p-4"><ToastFeedback error={error} /></div>}
      <div className="divide-y divide-sand-100 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-sand-500">{row.orders.length} pesanan gabungan</p><p className="mt-1 text-lg font-extrabold text-sand-900">{rupiah(row.totalAmountTarget)}</p></div>{row.paymentProofFile ? <ProofViewerButton url={row.paymentProofFile} className="text-sm font-bold text-brand-700"/> : <span className="text-sm text-rose-700">Tanpa bukti</span>}</div><ul className="space-y-1 rounded-xl bg-sand-50 p-3 text-sm">{row.orders.map((order) => <li key={order.orderId} className="flex justify-between gap-2"><Link href={`/pesanan/${order.orderId}`} className="font-bold text-brand-700">{order.campaignTitle}</Link><span>{rupiah(order.allocatedAmount)}</span></li>)}</ul><button type="button" onClick={() => openReview(row)} className="min-h-11 w-full rounded-xl border border-brand-300 text-sm font-bold text-brand-700">Tinjau checkout</button></article>)}</div>
      <div className="hidden overflow-x-auto md:block">
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
                <button type="button" onClick={() => openReview(row)} className="min-h-9 rounded-lg border border-brand-300 px-3 text-xs font-bold text-brand-700">Tinjau</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {reviewRow && <WorkspaceDialog title="Tinjau checkout gabungan" eyebrow="Verifikasi pembayaran" onClose={() => setReviewRow(null)} footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setReviewRow(null)} className="min-h-11 rounded-xl border border-sand-300 px-5 text-sm font-bold">Batal</button><button type="button" disabled={busyId === reviewRow.id || (decision === "REJECT" && !reason.trim())} onClick={() => void submitReview()} className={`min-h-11 rounded-xl px-5 text-sm font-extrabold text-white disabled:opacity-50 ${decision === "REJECT" ? "bg-rose-600" : "bg-brand-600"}`}>{busyId ? "Menyimpan..." : decision === "REJECT" ? "Tolak checkout" : "Verifikasi checkout"}</button></div>}><div className="space-y-5"><div className="rounded-xl bg-sand-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Total pembayaran</p><p className="mt-1 text-2xl font-extrabold text-sand-900">{rupiah(reviewRow.totalAmountTarget)}</p><p className="mt-2 text-sm text-sand-500">{reviewRow.orders.length} pesanan · {reviewRow.submittedAt ? waitingSince(reviewRow.submittedAt) : "Belum dikirim"}</p></div><div><p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-sand-500">Alokasi per pesanan</p><ul className="divide-y divide-sand-100 rounded-xl border border-sand-200">{reviewRow.orders.map((order) => <li key={order.orderId} className="flex justify-between gap-2 p-3 text-sm"><Link href={`/pesanan/${order.orderId}`} className="font-bold text-brand-700">{order.campaignTitle}</Link><strong>{rupiah(order.allocatedAmount)}</strong></li>)}</ul></div><div className="text-sm">Bukti: {reviewRow.paymentProofFile ? <ProofViewerButton url={reviewRow.paymentProofFile} className="font-bold text-brand-700" /> : <b className="text-rose-700">Belum ada</b>}</div><div className="border-t border-sand-100 pt-4"><p className="text-sm font-bold">Keputusan</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setDecision("VERIFY")} className={`min-h-11 rounded-xl border text-sm font-bold ${decision === "VERIFY" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sand-200"}`}>Verifikasi</button><button type="button" onClick={() => setDecision("REJECT")} className={`min-h-11 rounded-xl border text-sm font-bold ${decision === "REJECT" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-sand-200"}`}>Tolak</button></div>{decision === "REJECT" && <label className="mt-3 block text-sm font-bold">Alasan untuk Buyer<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-sand-300 p-3 font-normal" /></label>}</div><ToastFeedback error={error} /></div></WorkspaceDialog>}
    </div>
  );
}

function rupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function waitingSince(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}
