"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, EmptyState, IconButton, Input, Select } from "@/components/ui";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { PembeliHistoryModal } from "@/components/PembeliHistoryModal";

// Satu baris per akun Buyer (v2.3.9 FR-42.3) — sebelumnya satu baris per
// pesanan, sehingga satu Buyer dengan banyak pesanan muncul berulang kali.
export type PembeliRow = {
  id: string;
  namaPembeli: string;
  email: string | null;
  phone: string | null;
  kontak: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalPurchase: number;
  lastTransactionAt: string | null;
};

export type PembeliMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PembeliFilters = {
  search: string;
  campaignId: string;
  sort: string;
  order: "asc" | "desc";
};

interface Props {
  rows: PembeliRow[];
  meta: PembeliMeta;
  campaigns: { id: string; namaProduk: string }[];
  filters: PembeliFilters;
}

function SortHeader({ label, sortKey, active, order, onSort }: { label: string; sortKey: string; active: boolean; order: "asc" | "desc"; onSort: (key: string) => void }) {
  return <th className="px-5 py-3 font-medium"><button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-sand-700">{label}<span className="text-sand-400">{active ? (order === "asc" ? "▲" : "▼") : "↕"}</span></button></th>;
}

export default function PembeliTable({ rows, meta, campaigns, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  useOverlayWhilePending(pending);

  const [search, setSearch] = useState(filters.search);
  const [historyId, setHistoryId] = useState<string | null>(null);

  // Bangun URL baru dari param sekarang + patch. Perubahan filter/sort selalu
  // mereset ke halaman 1 (kecuali patch memang mengubah `page`).
  const updateQuery = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in patch)) params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const toggleSort = (key: string) => {
    const order =
      filters.sort === key && filters.order === "asc" ? "desc" : "asc";
    updateQuery({ sort: key, order });
  };

  const resetFilters = () => {
    setSearch("");
    updateQuery({ search: undefined, campaignId: undefined });
  };

  const hasFilter = !!filters.search || !!filters.campaignId;

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              updateQuery({ search: search.trim() || undefined });
            }}
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-sand-500">
                Cari pembeli
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama, WA, atau email…"
              />
            </div>
            <button
              type="submit"
              className="mb-0.5 self-end rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Cari
            </button>
          </form>

          <div className="w-full md:w-56">
            <label className="mb-1 block text-xs font-medium text-sand-500">
              Batch PO diikuti
            </label>
            <Select
              value={filters.campaignId}
              onChange={(e) =>
                updateQuery({ campaignId: e.target.value || undefined })
              }
            >
              <option value="">— semua Batch PO —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.namaProduk}
                </option>
              ))}
            </Select>
          </div>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="mb-0.5 self-end rounded-lg px-3 py-2 text-sm font-medium text-sand-600 hover:bg-sand-100"
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* Tabel */}
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title={hasFilter ? "Tidak ditemukan" : "Belum ada pembeli"}
            description={
              hasFilter
                ? "Tidak ada pembeli yang cocok dengan filter saat ini."
                : "Pembeli akan muncul di sini setelah ada pesanan masuk."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                  <SortHeader label="Pembeli" sortKey="namaPembeli" active={filters.sort === "namaPembeli"} order={filters.order} onSort={toggleSort} />
                  <th className="px-5 py-3 font-medium">Kontak</th>
                  <th className="px-5 py-3 font-medium">Pesanan</th>
                  <th className="px-5 py-3 font-medium">Total pembelian</th>
                  <th className="px-5 py-3 font-medium">Transaksi terakhir</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {rows.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-sand-50">
                    <td className="px-5 py-3 font-medium text-sand-900">{buyer.namaPembeli}</td>
                    <td className="px-5 py-3 text-sand-600">
                      <p>{buyer.phone ?? "—"}</p>
                      <p className="text-xs text-sand-400">{buyer.email ?? "Tanpa email"}</p>
                    </td>
                    <td className="px-5 py-3 text-sand-700">{buyer.orderCount}</td>
                    <td className="px-5 py-3 font-medium text-sand-700">{formatRupiah(buyer.totalPurchase)}</td>
                    <td className="px-5 py-3 text-sand-600">
                      {buyer.lastTransactionAt ? formatTanggal(buyer.lastTransactionAt) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <IconButton title="Lihat riwayat pembelian" onClick={() => setHistoryId(buyer.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-sand-100 px-5 py-3 text-sm text-sand-600">
            <span>
              {start}–{end} dari {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuery({ page: String(meta.page - 1) })}
                disabled={meta.page <= 1}
                className="rounded px-3 py-1 hover:bg-sand-100 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              <span>
                {meta.page} / {meta.totalPages}
              </span>
              <button
                onClick={() => updateQuery({ page: String(meta.page + 1) })}
                disabled={meta.page >= meta.totalPages}
                className="rounded px-3 py-1 hover:bg-sand-100 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </Card>
      {historyId && <PembeliHistoryModal buyerId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}
