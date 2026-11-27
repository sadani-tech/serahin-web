"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProofViewerButton } from "@/components/ProofViewerButton";
import { ToastFeedback, useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { reviewPayments } from "./actions";
import { useSort } from "@/hooks/useSort";
import { SortableTh } from "@/components/SortableTh";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";

export type PaymentVerificationRow = {
  id: string;
  jenis: "DP" | "PELUNASAN" | "LUNAS";
  jumlah: string | number;
  channel: "MANUAL_TRANSFER" | "GATEWAY";
  buktiFile: string | null;
  createdAt: string;
  reviewVersion: number;
  order: {
    id: string;
    namaPembeli: string;
    kontak: string;
    campaign: { namaProduk: string };
    seller: { id: string | null; nama: string };
    items: { productNameSnapshot: string; variantNameSnapshot: string; quantity: number }[];
  };
};

export function PaymentVerificationTable({ rows }: { rows: PaymentVerificationRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewRow, setReviewRow] = useState<PaymentVerificationRow | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"TERVERIFIKASI" | "DITOLAK">("TERVERIFIKASI");
  const [reviewReason, setReviewReason] = useState("");
  const headRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const { confirm, prompt } = useConfirm();
  const { sorted, sortKey, direction, toggle: toggleSort } = useSort(rows, (row, key) => {
    switch (key) {
      case "buyer": return row.order.namaPembeli;
      case "batchPo": return row.order.campaign.namaProduk;
      case "jenis": return row.jenis;
      case "nominal": return Number(row.jumlah);
      case "menunggu": return row.createdAt;
      default: return null;
    }
  });
  const allChecked = rows.length > 0 && selected.size === rows.length;

  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = selected.size > 0 && !allChecked;
  }, [allChecked, selected.size]);

  async function submit(decision: "TERVERIFIKASI" | "DITOLAK", ids = [...selected], fromReview = false) {
    setError("");
    if (!ids.length) return;
    const reason = decision === "DITOLAK" ? (fromReview ? reviewReason.trim() : await prompt({ title: `Tolak ${ids.length} pembayaran?`, description: "Alasan penolakan akan terlihat oleh Buyer.", label: "Alasan penolakan", confirmLabel: "Tolak", variant: "danger" })) : undefined;
    if (decision === "DITOLAK" && !reason) return;
    const total = rows.filter((row) => ids.includes(row.id)).reduce((sum, row) => sum + Number(row.jumlah), 0);
    const ok = decision === "TERVERIFIKASI" && !fromReview
      ? await confirm({ title: `Verifikasi ${ids.length} pembayaran dengan total ${rupiah(total)}?`, confirmLabel: "Verifikasi", variant: "primary" })
      : true;
    if (!ok) return;
    setBusy(true);
    const result = await reviewPayments(ids, decision, reason ?? "");
    setBusy(false);
    if (result.error) return setError(result.error);
    setSelected(new Set());
    setReviewRow(null);
    toast.success(`${result.updated ?? ids.length} pembayaran berhasil ${decision === "TERVERIFIKASI" ? "diverifikasi" : "ditolak"}.`);
    router.refresh();
  }

  return <div>
    {selected.size > 0 && <div className="space-y-3 border-b border-sand-200 bg-sand-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <strong className="text-sm">{selected.size} pembayaran dipilih</strong>
        <Button type="button" disabled={busy} onClick={() => submit("TERVERIFIKASI")}>Verifikasi</Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => submit("DITOLAK")}>Tolak</Button>
      </div>
      <ToastFeedback error={error} />
    </div>}
    <div className="divide-y divide-sand-100 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Pilih pembayaran ${row.order.namaPembeli}`} checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} className="mt-1 h-5 w-5"/><div className="min-w-0 flex-1"><Link href={`/pesanan/${row.order.id}`} className="font-extrabold text-sand-900">{row.order.namaPembeli}</Link><p className="text-xs text-sand-500">{row.order.campaign.namaProduk} · {row.jenis}</p></div><b className="text-sm text-brand-700">{rupiah(Number(row.jumlah))}</b></div><div className="flex items-center justify-between rounded-xl bg-sand-50 p-3 text-sm"><span>{waitingSince(row.createdAt)}</span>{row.buktiFile ? <ProofViewerButton url={row.buktiFile} className="font-bold text-brand-700"/> : <span className="text-rose-700">Tanpa bukti</span>}</div><button type="button" onClick={() => { setReviewRow(row); setReviewDecision("TERVERIFIKASI"); setReviewReason(""); }} className="min-h-11 w-full rounded-xl border border-brand-300 text-sm font-bold text-brand-700">Tinjau pembayaran</button></article>)}</div>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[780px] text-sm">
        <thead><tr className="border-b bg-sand-50 text-left text-xs uppercase tracking-wide text-sand-500">
          <th className="px-4 py-3"><input ref={headRef} type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((row) => row.id)))} /></th>
          <SortableTh label="Pesanan & Buyer" sortKey="buyer" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <SortableTh label="Jenis" sortKey="jenis" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <SortableTh label="Nominal" sortKey="nominal" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 text-right font-medium" />
          <SortableTh label="Diajukan" sortKey="menunggu" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <th className="px-4 py-3 text-right">Tindakan</th>
        </tr></thead>
        <tbody className="divide-y divide-sand-100">{sorted.map((row) => <tr key={row.id} className="hover:bg-sand-50">
          <td className="px-4 py-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} /></td>
          <td className="px-4 py-4"><Link href={`/pesanan/${row.order.id}`} className="font-bold text-sand-900 hover:underline">{row.order.namaPembeli}</Link><div className="mt-1 text-xs text-sand-600">{row.order.campaign.namaProduk}</div><div className="max-w-64 truncate text-xs text-sand-400">{row.order.items.map((item) => `${item.variantNameSnapshot} × ${item.quantity}`).join(", ")}</div></td>
          <td className="px-4 py-4"><span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{row.jenis}</span><p className="mt-1 text-xs text-sand-500">{row.channel === "MANUAL_TRANSFER" ? "Transfer manual" : "Otomatis"}</p></td>
          <td className="px-4 py-4 text-right font-extrabold tabular-nums text-sand-900">{rupiah(Number(row.jumlah))}</td>
          <td className="px-4 py-4 text-xs text-sand-600">{waitingSince(row.createdAt)}<p className="mt-1">{row.buktiFile ? <ProofViewerButton url={row.buktiFile} className="font-bold text-brand-700 hover:underline" /> : <span className="text-rose-600">Tanpa bukti</span>}</p></td>
          <td className="px-4 py-4 text-right"><button type="button" onClick={() => { setReviewRow(row); setReviewDecision("TERVERIFIKASI"); setReviewReason(""); }} className="min-h-9 rounded-lg border border-brand-300 px-3 text-xs font-bold text-brand-700 hover:bg-brand-50">Tinjau</button></td>
        </tr>)}</tbody>
      </table>
      {reviewRow && <WorkspaceDialog title="Tinjau pembayaran" eyebrow="Verifikasi manual" onClose={() => setReviewRow(null)} footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setReviewRow(null)} className="min-h-11 rounded-xl border border-sand-300 px-5 text-sm font-bold">Batal</button><button type="button" disabled={busy || (reviewDecision === "DITOLAK" && !reviewReason.trim())} onClick={() => void submit(reviewDecision, [reviewRow.id], true)} className={`min-h-11 rounded-xl px-5 text-sm font-extrabold text-white disabled:opacity-50 ${reviewDecision === "DITOLAK" ? "bg-rose-600" : "bg-brand-600"}`}>{busy ? "Menyimpan..." : reviewDecision === "DITOLAK" ? "Tolak pembayaran" : "Verifikasi pembayaran"}</button></div>}>
        <div className="space-y-5"><div className="rounded-2xl bg-sand-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Nominal yang diajukan</p><p className="mt-1 text-3xl font-extrabold text-sand-900">{rupiah(Number(reviewRow.jumlah))}</p><p className="mt-2 text-sm text-sand-600">{reviewRow.jenis} · {reviewRow.channel === "MANUAL_TRANSFER" ? "Transfer manual" : "Pembayaran otomatis"}</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-sand-500">Buyer</dt><dd className="font-bold">{reviewRow.order.namaPembeli}</dd><dd className="text-sand-500">{reviewRow.order.kontak}</dd></div><div><dt className="text-xs text-sand-500">Batch PO</dt><dd className="font-bold">{reviewRow.order.campaign.namaProduk}</dd><dd className="text-sand-500">{reviewRow.order.items.map((item) => `${item.variantNameSnapshot} × ${item.quantity}`).join(", ")}</dd></div><div><dt className="text-xs text-sand-500">Diajukan</dt><dd>{waitingSince(reviewRow.createdAt)}</dd></div><div><dt className="text-xs text-sand-500">Bukti pembayaran</dt><dd>{reviewRow.buktiFile ? <ProofViewerButton url={reviewRow.buktiFile} className="font-bold text-brand-700" /> : <span className="font-bold text-rose-700">Belum dilampirkan</span>}</dd></div></dl><div className="border-t border-sand-100 pt-5"><p className="text-sm font-bold text-sand-900">Keputusan</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setReviewDecision("TERVERIFIKASI")} className={`min-h-11 rounded-xl border text-sm font-bold ${reviewDecision === "TERVERIFIKASI" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sand-200 text-sand-600"}`}>Verifikasi</button><button type="button" onClick={() => setReviewDecision("DITOLAK")} className={`min-h-11 rounded-xl border text-sm font-bold ${reviewDecision === "DITOLAK" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-sand-200 text-sand-600"}`}>Tolak</button></div>{reviewDecision === "DITOLAK" && <label className="mt-4 block text-sm font-bold text-sand-700">Alasan untuk Buyer<textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} required rows={3} className="mt-2 w-full rounded-xl border border-sand-300 p-3 font-normal" placeholder="Jelaskan apa yang perlu diperbaiki" /></label>}</div><ToastFeedback error={error} /></div>
      </WorkspaceDialog>}
    </div>
  </div>;
}

function rupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function waitingSince(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
