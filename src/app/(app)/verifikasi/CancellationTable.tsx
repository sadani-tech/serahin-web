"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ToastFeedback, useToast } from "@/components/Toast";
import { decideCancellation, completeRefund } from "./actions";

export type CancellationRow = {
  id: string;
  namaPembeli: string;
  kontak: string;
  campaign: { namaProduk: string };
  cancellationRequestStatus: "REQUESTED" | "APPROVED" | "REJECTED";
  cancellationRequestedAt: string | null;
  alasanBatal: string | null;
  cancellationDecisionReason: string | null;
  refundStatus: "NOT_REQUIRED" | "PENDING" | "COMPLETED" | null;
  refundNote: string | null;
  refundCompletedAt: string | null;
  billing: { dibayar: number };
};

const STATUS_LABEL: Record<CancellationRow["cancellationRequestStatus"], string> = {
  REQUESTED: "Menunggu keputusan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};
const STATUS_BADGE: Record<CancellationRow["cancellationRequestStatus"], string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-sand-100 text-sand-600",
};

export function CancellationTable({ rows }: { rows: CancellationRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();

  async function approve(row: CancellationRow) {
    if (!window.confirm(`Setujui pembatalan pesanan ${row.namaPembeli}? Status pesanan akan menjadi Dibatalkan.`)) return;
    setError("");
    setBusyId(row.id);
    const result = await decideCancellation(row.id, "APPROVE");
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success("Pembatalan disetujui.");
    router.refresh();
  }

  async function reject(row: CancellationRow) {
    const alasan = window.prompt("Alasan menolak pengajuan pembatalan:")?.trim();
    if (!alasan) return;
    setError("");
    setBusyId(row.id);
    const result = await decideCancellation(row.id, "REJECT", alasan);
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success("Pengajuan pembatalan ditolak.");
    router.refresh();
  }

  async function markRefunded(row: CancellationRow) {
    const catatan = window.prompt("Catatan refund (opsional) — mis. cara/bukti transfer balik:") ?? undefined;
    if (!window.confirm(`Tandai refund untuk pesanan ${row.namaPembeli} sudah selesai dilakukan manual?`)) return;
    setError("");
    setBusyId(row.id);
    const result = await completeRefund(row.id, catatan);
    setBusyId(null);
    if (result.error) return setError(result.error);
    toast.success("Refund ditandai selesai.");
    router.refresh();
  }

  return (
    <div>
      {error && <div className="border-b border-sand-200 bg-sand-50 p-4"><ToastFeedback error={error} /></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-sand-500">
            <th className="px-4 py-3 font-medium">Buyer</th>
            <th className="px-4 py-3 font-medium">Batch PO</th>
            <th className="px-4 py-3 font-medium">Alasan Buyer</th>
            <th className="px-4 py-3 font-medium">Diajukan</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Refund</th>
            <th className="px-4 py-3 font-medium">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-sand-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-sand-50">
                <td className="px-4 py-3"><Link href={`/pesanan/${row.id}`} className="font-bold text-sand-900 hover:underline">{row.namaPembeli}</Link><div className="text-xs text-sand-500">{row.kontak}</div></td>
                <td className="px-4 py-3">{row.campaign.namaProduk}</td>
                <td className="px-4 py-3 text-sand-700">
                  {row.alasanBatal}
                  {row.cancellationRequestStatus === "REJECTED" && row.cancellationDecisionReason && (
                    <p className="mt-1 text-xs font-semibold text-rose-700">Alasan tolak: {row.cancellationDecisionReason}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-sand-600">{row.cancellationRequestedAt ? formatTanggal(row.cancellationRequestedAt) : "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_BADGE[row.cancellationRequestStatus]}`}>{STATUS_LABEL[row.cancellationRequestStatus]}</span></td>
                <td className="px-4 py-3 text-xs">
                  {row.refundStatus === "PENDING" && <span className="text-amber-700">Menunggu refund · sudah dibayar {formatRupiah(row.billing.dibayar)}</span>}
                  {row.refundStatus === "COMPLETED" && <span className="text-emerald-700">Selesai {row.refundCompletedAt ? formatTanggal(row.refundCompletedAt) : ""}{row.refundNote ? ` — ${row.refundNote}` : ""}</span>}
                  {(row.refundStatus === "NOT_REQUIRED" || !row.refundStatus) && <span className="text-sand-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.cancellationRequestStatus === "REQUESTED" && (
                      <>
                        <button disabled={busyId === row.id} onClick={() => approve(row)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Setujui</button>
                        <button disabled={busyId === row.id} onClick={() => reject(row)} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Tolak</button>
                      </>
                    )}
                    {row.cancellationRequestStatus === "APPROVED" && row.refundStatus === "PENDING" && (
                      <button disabled={busyId === row.id} onClick={() => markRefunded(row)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Tandai Refund Selesai</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
