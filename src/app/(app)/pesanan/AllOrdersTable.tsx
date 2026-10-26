"use client";

import Link from "next/link";
import { OrderBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { useSort } from "@/hooks/useSort";
import { SortableTh } from "@/components/SortableTh";
import type { OrderStatus } from "@/lib/types";

export type AllOrdersRow = {
  id: string;
  namaPembeli: string;
  kontak: string;
  status: OrderStatus;
  createdAt: string;
  campaign: { id: string; namaProduk: string };
  items: { namaVarian: string; jumlah: number }[];
  billing: { total: number; dibayar: number; sisa: number };
  paymentStatus: string;
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  LUNAS: "Lunas",
  DP_DITERIMA: "DP diterima",
  DITOLAK: "Ditolak",
  BELUM_BAYAR: "Belum bayar",
};

export function AllOrdersTable({ rows }: { rows: AllOrdersRow[] }) {
  const { sorted, sortKey, direction, toggle: toggleSort } = useSort(rows, (row, key) => {
    switch (key) {
      case "pembeli": return row.namaPembeli;
      case "batchPo": return row.campaign.namaProduk;
      case "status": return row.status;
      case "tanggal": return row.createdAt;
      default: return null;
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs uppercase text-sand-500">
          <SortableTh label="Pembeli" sortKey="pembeli" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <SortableTh label="Batch PO" sortKey="batchPo" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <th className="px-4 py-3 font-medium">Item</th>
          <SortableTh label="Status" sortKey="status" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
          <th className="px-4 py-3 font-medium">Tagihan</th>
          <th className="px-4 py-3 font-medium">Pembayaran</th>
          <SortableTh label="Tanggal" sortKey="tanggal" activeKey={sortKey} direction={direction} onSort={toggleSort} className="px-4 py-3 font-medium" />
        </tr></thead>
        <tbody className="divide-y divide-sand-100">
          {sorted.map((row) => (
            <tr key={row.id} className="hover:bg-sand-50">
              <td className="px-4 py-3"><Link href={`/pesanan/${row.id}`} className="font-bold text-sand-900 hover:underline">{row.namaPembeli}</Link><div className="text-xs text-sand-500">{row.kontak}</div></td>
              <td className="px-4 py-3"><Link href={`/pre-orders/${row.campaign.id}`} className="hover:underline">{row.campaign.namaProduk}</Link></td>
              <td className="px-4 py-3 text-sand-700">{row.items.map((item) => `${item.namaVarian} × ${item.jumlah}`).join(", ")}</td>
              <td className="px-4 py-3"><OrderBadge status={row.status} /></td>
              <td className="px-4 py-3">
                <div className="font-bold text-sand-900">{formatRupiah(row.billing.total)}</div>
                {row.billing.sisa > 0 && <div className="text-xs text-rose-600">Sisa {formatRupiah(row.billing.sisa)}</div>}
              </td>
              <td className="px-4 py-3 text-xs text-sand-600">{PAYMENT_STATUS_LABEL[row.paymentStatus] ?? row.paymentStatus}</td>
              <td className="px-4 py-3 text-xs text-sand-600">{formatTanggal(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
