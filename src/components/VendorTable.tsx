"use client"

import { useState } from "react";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { computeVendorStats, ratingStars } from "@/lib/vendor";

type VendorRow = {
  id: string;
  nama: string;
  kontak: string | null;
  spesialisasi: string | null;
  _count: { campaigns: number };
  evaluations: {
    rating: number;
    ketepatanWaktu: "TEPAT_WAKTU" | "TELAT";
    jumlahHariTelat: number | null;
  }[];
};

interface Props {
  vendors: VendorRow[];
}

export default function VendorTable({ vendors }: Props) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(vendors.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageVendors = vendors.slice(start, end);

  return (
    <Card>
      {vendors.length === 0 ? (
        <EmptyState
          title="Belum ada vendor"
          description="Tambahkan profil vendor pertama Anda."
          action={<LinkButton href="/vendor/baru">+ Vendor Baru</LinkButton>}
        />
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Spesialisasi</th>
                <th className="px-5 py-3 font-medium">Kampanye</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Telat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageVendors.map((v) => {
                const stats = computeVendorStats(v.evaluations);
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/vendor/${v.id}`} className="font-medium text-slate-900 hover:underline">
                        {v.nama}
                      </Link>
                      {v.kontak && <div className="text-xs text-slate-500">{v.kontak}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{v.spesialisasi ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-700">{v._count.campaigns}</td>
                    <td className="px-5 py-3 text-amber-600">{ratingStars(stats.avgRating)}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {stats.jumlahTelat > 0 ? (
                        <span className="text-rose-600">
                          {stats.jumlahTelat}× ({stats.totalHariTelat} hari)
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* pagination controls */}
          <div className="flex justify-center space-x-2 py-2">
            <button
              className="rounded px-3 py-1 text-sm bg-slate-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="px-2 text-sm">{page} / {totalPages}</span>
            <button
              className="rounded px-3 py-1 text-sm bg-slate-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
