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

  async function submit(keputusan: "APPROVE" | "REJECT", ids = Array.from(selected)) {
    setError("");
    if (!ids.length) return;
    const reason = keputusan === "REJECT" ? await prompt({ title: `Tolak ${ids.length} pesanan?`, description: "Alasan akan terlihat oleh Buyer.", label: "Alasan penolakan", confirmLabel: "Tolak", variant: "danger" }) : undefined;
    if (keputusan === "REJECT" && !reason) return;
    if (keputusan === "APPROVE" && !await confirm({ title: `Setujui ${ids.length} pesanan?`, description: "Pesanan akan masuk ke tahap pembayaran atau pemrosesan.", confirmLabel: "Setujui", variant: "primary" })) return;
    setBusy(true);
    const result = await reviewOrders(ids, keputusan, reason ?? "");
    setBusy(false);
    if (result.error) return setError(result.error);
    setSelected(new Set());
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
      <div className="divide-y divide-sand-100 md:hidden">{rows.map((row) => <article key={row.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Pilih pesanan ${row.namaPembeli}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="mt-1 h-5 w-5"/><div className="min-w-0"><Link href={`/pesanan/${row.id}`} className="font-extrabold text-sand-900">{row.namaPembeli}</Link><p className="text-xs text-sand-500">{row.kontak}</p></div></div><div className="rounded-xl bg-sand-50 p-3 text-sm"><b>{row.campaign.namaProduk}</b><p className="mt-1 text-sand-600">{row.items.map((item) => `${item.variant.namaVarian} × ${item.jumlah}`).join(", ")}</p>{row.flagDuplikat && <p className="mt-2 font-bold text-amber-800">Periksa kemungkinan duplikat</p>}</div><div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => submit("APPROVE", [row.id])} className="min-h-11 rounded-xl bg-brand-600 text-sm font-bold text-white">Setujui</button><button disabled={busy} onClick={() => submit("REJECT", [row.id])} className="min-h-11 rounded-xl border border-rose-300 text-sm font-bold text-rose-700">Tolak</button></div></article>)}</div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-sand-500">
            <th className="px-4 py-3"><input ref={headRef} type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
            <SortableTh label="Pembeli" sortKey="pembeli" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
            <SortableTh label="Batch PO" sortKey="batchPo" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
            <th className="px-4 py-3">Item</th>
            <SortableTh label="Indikator" sortKey="indikator" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          </tr></thead>
          <tbody className="divide-y divide-sand-100">
            {sorted.map((row) => <tr key={row.id} className={row.flagDuplikat ? "bg-amber-50" : "hover:bg-sand-50"}>
              <td className="px-4 py-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>
              <td className="px-4 py-3"><Link className="font-medium hover:underline" href={`/pesanan/${row.id}`}>{row.namaPembeli}</Link><div className="text-xs text-sand-500">{row.kontak}</div></td>
              <td className="px-4 py-3">{row.campaign.namaProduk}</td>
              <td className="px-4 py-3">{row.items.map((item) => `${item.variant.namaVarian} × ${item.jumlah}`).join(", ")}</td>
              <td className="px-4 py-3">{row.flagDuplikat ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Duplikat mencurigakan</span> : <span className="text-sand-400">Normal</span>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
