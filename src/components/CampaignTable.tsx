"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatRupiah, formatTanggal, toNumber } from "@/lib/format";

export type CampaignStatus =
  | "OPEN"
  | "CLOSED"
  | "PRODUKSI"
  | "SIAP_KIRIM"
  | "SELESAI";

export type CampaignRow = {
  id: string;
  namaProduk: string;
  status: CampaignStatus;
  tanggalTutup: string | null;
  kuotaTotal: number;
  terisi: number;
  variants: { harga: string }[];
  _count: { orders: number };
};

const PAGE_SIZE = 10;

function rentangHarga(variants: { harga: string }[]): string {
  if (variants.length === 0) return "-";
  const hargas = variants.map((v) => toNumber(v.harga));
  const min = Math.min(...hargas);
  const max = Math.max(...hargas);
  return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

export default function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageCampaigns = campaigns.slice(start, end);

  return (
    <Card>
      {campaigns.length === 0 ? (
        <EmptyState
          title="Belum ada kampanye"
          description="Mulai dengan membuat kampanye Pre-Order pertama Anda."
          action={<LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>}
        />
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {pageCampaigns.map((c) => {
              const persen =
                c.kuotaTotal > 0
                  ? Math.round((c.terisi / c.kuotaTotal) * 100)
                  : 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/kampanye/${c.id}`}
                    className="block px-4 py-4 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {c.namaProduk}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {rentangHarga(c.variants)}
                        </p>
                      </div>
                      <CampaignBadge status={c.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {c.terisi} / {c.kuotaTotal} kuota
                      </span>
                      <span>
                        {c._count.orders} pesanan · tutup{" "}
                        {formatTanggal(c.tanggalTutup)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          persen >= 90
                            ? "bg-rose-500"
                            : persen >= 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, persen)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
            {/* pagination */}
            {campaigns.length > PAGE_SIZE && (
              <div className="flex justify-center gap-3 py-3 text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  ‹
                </button>
                <span className="text-slate-600">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded px-3 py-1 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            )}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Produk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Harga</th>
                  <th className="px-5 py-3 font-medium">Kuota</th>
                  <th className="px-5 py-3 font-medium">Pesanan</th>
                  <th className="px-5 py-3 font-medium">Tutup PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/kampanye/${c.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {c.namaProduk}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <CampaignBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {rentangHarga(c.variants)}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {c.terisi} / {c.kuotaTotal}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {c._count.orders}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatTanggal(c.tanggalTutup)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length > PAGE_SIZE && (
              <div className="flex justify-center gap-3 py-3 text-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  ‹
                </button>
                <span className="text-slate-600">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded px-3 py-1 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
