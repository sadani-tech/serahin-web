"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ToastFeedback, useToast } from "@/components/Toast";
import { reviewPayments } from "./actions";

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
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const allChecked = rows.length > 0 && selected.size === rows.length;

  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = selected.size > 0 && !allChecked;
  }, [allChecked, selected.size]);

  async function submit(decision: "TERVERIFIKASI" | "DITOLAK", ids = [...selected]) {
    setError("");
    if (!ids.length) return;
    if (decision === "DITOLAK" && !reason.trim()) return setError("Alasan penolakan wajib diisi.");
    const total = rows.filter((row) => ids.includes(row.id)).reduce((sum, row) => sum + Number(row.jumlah), 0);
    const message = decision === "TERVERIFIKASI"
      ? `Verifikasi ${ids.length} pembayaran dengan total ${rupiah(total)}?`
      : `Tolak ${ids.length} pembayaran? Alasan akan terlihat oleh Buyer.`;
    if (!window.confirm(message)) return;
    setBusy(true);
    const result = await reviewPayments(ids, decision, reason);
    setBusy(false);
    if (result.error) return setError(result.error);
    setSelected(new Set());
    setReason("");
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
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Alasan penolakan (wajib untuk Tolak)" className="min-h-20 w-full rounded-xl border border-sand-300 px-3 py-2 text-sm" />
      <ToastFeedback error={error} />
    </div>}
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-sm">
        <thead><tr className="border-b text-left text-xs uppercase text-sand-500">
          <th className="px-4 py-3"><input ref={headRef} type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((row) => row.id)))} /></th>
          <th className="px-4 py-3">Buyer</th><th className="px-4 py-3">Batch PO</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Bukti</th><th className="px-4 py-3">Menunggu</th><th className="px-4 py-3">Aksi</th>
        </tr></thead>
        <tbody className="divide-y divide-sand-100">{rows.map((row) => <tr key={row.id} className="hover:bg-sand-50">
          <td className="px-4 py-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} /></td>
          <td className="px-4 py-3"><Link href={`/pesanan/${row.order.id}`} className="font-bold text-sand-900 hover:underline">{row.order.namaPembeli}</Link><div className="text-xs text-sand-500">{row.order.kontak}</div></td>
          <td className="px-4 py-3"><div className="font-medium">{row.order.campaign.namaProduk}</div><div className="text-xs text-sand-500">{row.order.items.map((item) => `${item.variantNameSnapshot} × ${item.quantity}`).join(", ")}</div></td>
          <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{row.jenis}</span></td>
          <td className="px-4 py-3 font-extrabold text-sand-900">{rupiah(Number(row.jumlah))}</td>
          <td className="px-4 py-3">{row.buktiFile ? <a href={row.buktiFile} target="_blank" rel="noreferrer" className="font-bold text-brand-700 hover:underline">Lihat bukti</a> : <span className="text-rose-600">Tidak ada</span>}</td>
          <td className="px-4 py-3 text-xs text-sand-600">{waitingSince(row.createdAt)}</td>
          <td className="px-4 py-3"><div className="flex gap-2"><button disabled={busy} onClick={() => submit("TERVERIFIKASI", [row.id])} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Verifikasi</button><button disabled={busy} onClick={() => { setSelected(new Set([row.id])); setError("Isi alasan, lalu pilih Tolak."); }} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700">Tolak</button></div></td>
        </tr>)}</tbody>
      </table>
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
