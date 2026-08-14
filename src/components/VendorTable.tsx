"use client"

import { useState } from "react";
import Link from "next/link";
import { Card, DeleteIconButton, EmptyState, LinkButton } from "@/components/ui";
import { computeVendorStats, ratingStars } from "@/lib/vendor";
import { deleteVendor } from "@/app/(app)/vendor/actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useNavLoading } from "@/hooks/useNavLoading";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm, alert } = useConfirm();
  const { startLoading, stopLoading } = useNavLoading();

  const totalPages = Math.ceil(vendors.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageVendors = vendors.slice(start, end);

  async function handleDelete(id: string, nama: string) {
    const ok = await confirm({
      title: `Hapus vendor "${nama}"?`,
      description:
        "Vendor tidak bisa dihapus jika masih punya kampanye aktif.",
      confirmLabel: "Hapus vendor",
    });
    if (!ok) return;
    setDeletingId(id);
    startLoading();
    try {
      const res = await deleteVendor(id);
      if (res?.error) {
        await alert({ title: "Tidak bisa menghapus vendor", description: res.error });
      }
    } catch {
      await alert({
        title: "Gagal menghapus vendor",
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setDeletingId(null);
      stopLoading();
    }
  }

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
                <th className="px-5 py-3 font-medium"></th>
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
                    <td className="px-5 py-3 text-right">
                      <DeleteIconButton
                        onClick={() => handleDelete(v.id, v.nama)}
                        loading={deletingId === v.id}
                        title="Hapus vendor"
                      />
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
