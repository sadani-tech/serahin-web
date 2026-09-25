"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { reviewOrders } from "./actions";
import { ToastFeedback, useToast } from "@/components/Toast";
import { useSort } from "@/hooks/useSort";
import { SortableTh } from "@/components/SortableTh";

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
  const [alasan, setAlasan] = useState("");
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

  async function submit(keputusan: "APPROVE" | "REJECT") {
    setError("");
    if (keputusan === "REJECT" && !alasan.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setBusy(true);
    const result = await reviewOrders(Array.from(selected), keputusan, alasan);
    setBusy(false);
    if (result.error) return setError(result.error);
    setSelected(new Set());
    setAlasan("");
    toast.success(`${selected.size} pesanan berhasil ${keputusan === "APPROVE" ? "disetujui" : "ditolak"}.`);
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
          <textarea
            value={alasan}
            onChange={(event) => setAlasan(event.target.value)}
            placeholder="Alasan penolakan (wajib untuk aksi Tolak)"
            className="min-h-20 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
          />
          <ToastFeedback error={error} />
        </div>
      )}
      <div className="overflow-x-auto">
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
