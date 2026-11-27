"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { reviewOrders } from "./actions";
import { ToastFeedback, useToast } from "@/components/Toast";
import { useSort } from "@/hooks/useSort";
import { SortableTh } from "@/components/SortableTh";
import { useConfirm } from "@/components/ConfirmDialog";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";

export type VerificationRow = {
  id: string;
  namaPembeli: string;
  kontak: string;
  flagDuplikat: boolean;
  createdAt: string;
  campaign: { namaProduk: string };
  items: { jumlah: number; variant: { namaVarian: string } }[];
};

export function VerificationTable({ rows }: { rows: VerificationRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewRow, setReviewRow] = useState<VerificationRow | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const { confirm, prompt } = useConfirm();
  const headRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { sorted, sortKey, direction, toggle: toggleSort } = useSort(rows, (row, key) => {
    switch (key) {
      case "pembeli": return row.namaPembeli;
      case "batchPo": return row.campaign.namaProduk;
      case "indikator": return row.flagDuplikat ? 1 : 0;
      default: return null;
    }
  });
  const allChecked = rows.length > 0 && selected.size === rows.length;
  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = selected.size > 0 && !allChecked;
  }, [allChecked, selected.size]);

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  async function submit(keputusan: "APPROVE" | "REJECT", ids = Array.from(selected), fromReview = false) {
    setError("");
    if (!ids.length) return;
    const reason = keputusan === "REJECT" ? (fromReview ? reviewReason.trim() : await prompt({ title: `Tolak ${ids.length} pesanan?`, description: "Alasan akan terlihat oleh Buyer.", label: "Alasan penolakan", confirmLabel: "Tolak", variant: "danger" })) : undefined;
    if (keputusan === "REJECT" && !reason) return;
    if (keputusan === "APPROVE" && !fromReview && !await confirm({ title: `Setujui ${ids.length} pesanan?`, description: "Pesanan akan masuk ke tahap pembayaran atau pemrosesan.", confirmLabel: "Setujui", variant: "primary" })) return;
    setBusy(true);
    const result = await reviewOrders(ids, keputusan, reason ?? "");
    setBusy(false);
    if (result.error) return setError(result.error);
    setSelected(new Set());
    setReviewRow(null);
    toast.success(`${ids.length} pesanan berhasil ${keputusan === "APPROVE" ? "disetujui" : "ditolak"}.`);
    router.refresh();
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="space-y-3 border-b border-sand-200 bg-sand-50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selected.size} pesanan dipilih</span>
            <Button type="button" disabled={busy} onClick={() => submit("APPROVE")}>Setujui</Button>
            <Button type="button" variant="danger" disabled={busy} onClick={() => submit("REJECT")}>Tolak</Button>
          </div>
          <ToastFeedback error={error} />
        </div>
      )}
      <div className="divide-y divide-sand-100 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Pilih pesanan ${row.namaPembeli}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="mt-1 h-5 w-5"/><div className="min-w-0"><Link href={`/pesanan/${row.id}`} className="font-extrabold text-sand-900">{row.namaPembeli}</Link><p className="text-xs text-sand-500">{row.kontak}</p></div></div><div className="rounded-xl bg-sand-50 p-3 text-sm"><b>{row.campaign.namaProduk}</b><p className="mt-1 text-sand-600">{row.items.map((item) => `${item.variant.namaVarian} × ${item.jumlah}`).join(", ")}</p>{row.flagDuplikat && <p className="mt-2 font-bold text-amber-800">Periksa kemungkinan duplikat</p>}</div><button type="button" onClick={() => { setReviewRow(row); setReviewDecision("APPROVE"); setReviewReason(""); }} className="min-h-11 w-full rounded-xl border border-brand-300 text-sm font-bold text-brand-700">Tinjau pesanan</button></article>)}</div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b bg-sand-50 text-left text-xs uppercase tracking-wide text-sand-500">
            <th className="px-4 py-3"><input ref={headRef} type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
            <SortableTh label="Pembeli" sortKey="pembeli" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
            <SortableTh label="Batch PO" sortKey="batchPo" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
            <th className="px-4 py-3">Item</th>
            <SortableTh label="Indikator" sortKey="indikator" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
            <th className="px-4 py-3 text-right">Tindakan</th>
          </tr></thead>
          <tbody className="divide-y divide-sand-100">
            {sorted.map((row) => <tr key={row.id} className={row.flagDuplikat ? "bg-amber-50" : "hover:bg-sand-50"}>
              <td className="px-4 py-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>
              <td className="px-4 py-3"><Link className="font-medium hover:underline" href={`/pesanan/${row.id}`}>{row.namaPembeli}</Link><div className="text-xs text-sand-500">{row.kontak}</div></td>
              <td className="px-4 py-3">{row.campaign.namaProduk}</td>
              <td className="max-w-64 px-4 py-3"><span className="line-clamp-2 text-sand-600">{row.items.map((item) => `${item.variant.namaVarian} × ${item.jumlah}`).join(", ")}</span></td>
              <td className="px-4 py-3">{row.flagDuplikat ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Duplikat mencurigakan</span> : <span className="text-sand-400">Normal</span>}</td>
              <td className="px-4 py-3 text-right"><button type="button" onClick={() => { setReviewRow(row); setReviewDecision("APPROVE"); setReviewReason(""); }} className="min-h-9 rounded-lg border border-brand-300 px-3 text-xs font-bold text-brand-700 hover:bg-brand-50">Tinjau</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {reviewRow && <WorkspaceDialog title="Tinjau pesanan" eyebrow="Verifikasi pesanan" onClose={() => setReviewRow(null)} footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setReviewRow(null)} className="min-h-11 rounded-xl border border-sand-300 px-5 text-sm font-bold">Batal</button><button type="button" disabled={busy || (reviewDecision === "REJECT" && !reviewReason.trim())} onClick={() => void submit(reviewDecision, [reviewRow.id], true)} className={`min-h-11 rounded-xl px-5 text-sm font-extrabold text-white disabled:opacity-50 ${reviewDecision === "REJECT" ? "bg-rose-600" : "bg-brand-600"}`}>{busy ? "Menyimpan..." : reviewDecision === "REJECT" ? "Tolak pesanan" : "Setujui pesanan"}</button></div>}>
        <div className="space-y-5"><div className="rounded-2xl bg-sand-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Buyer</p><p className="mt-1 text-xl font-extrabold text-sand-900">{reviewRow.namaPembeli}</p><p className="text-sm text-sand-500">{reviewRow.kontak}</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-sand-500">Batch PO</dt><dd className="font-bold">{reviewRow.campaign.namaProduk}</dd></div><div><dt className="text-xs text-sand-500">Dipesan</dt><dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(reviewRow.createdAt))}</dd></div></dl><div><p className="text-xs font-extrabold uppercase tracking-wide text-sand-500">Isi pesanan</p><ul className="mt-2 divide-y divide-sand-100 rounded-xl border border-sand-200">{reviewRow.items.map((item, index) => <li key={index} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{item.variant.namaVarian}</span><strong>× {item.jumlah}</strong></li>)}</ul></div>{reviewRow.flagDuplikat && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Indikator duplikat terdeteksi. Periksa pesanan Buyer sebelum menyetujui.</p>}<div className="border-t border-sand-100 pt-5"><p className="text-sm font-bold text-sand-900">Keputusan</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setReviewDecision("APPROVE")} className={`min-h-11 rounded-xl border text-sm font-bold ${reviewDecision === "APPROVE" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sand-200 text-sand-600"}`}>Setujui</button><button type="button" onClick={() => setReviewDecision("REJECT")} className={`min-h-11 rounded-xl border text-sm font-bold ${reviewDecision === "REJECT" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-sand-200 text-sand-600"}`}>Tolak</button></div>{reviewDecision === "REJECT" && <label className="mt-4 block text-sm font-bold text-sand-700">Alasan untuk Buyer<textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} required rows={3} className="mt-2 w-full rounded-xl border border-sand-300 p-3 font-normal" placeholder="Jelaskan alasan penolakan" /></label>}</div><ToastFeedback error={error} /></div>
      </WorkspaceDialog>}
    </div>
  );
}
