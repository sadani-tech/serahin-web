"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, DeleteIconButton, EmptyState, Select } from "@/components/ui";
import { deleteProduk } from "@/app/(app)/produk/actions";
import { ProdukModal } from "@/app/(app)/produk/ProdukModal";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { useNavLoading } from "@/hooks/useNavLoading";
import type { ProdukRow } from "@/app/(app)/produk/page";

type Meta = { total: number; page: number; limit: number; totalPages: number };
type SearchParams = { q?: string; status?: string; page?: string };

export default function ProdukTable({
  produk,
  meta,
  sp,
}: {
  produk: ProdukRow[];
  meta: Meta;
  sp: SearchParams;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const toast = useToast();
  const { startLoading, stopLoading } = useNavLoading();

  async function handleDelete(id: string, nama: string) {
    const ok = await confirm({
      title: `Hapus produk "${nama}"?`,
      description: "Produk yang sudah pernah dipakai di Batch PO tidak bisa dihapus — nonaktifkan saja lewat Edit Produk.",
      confirmLabel: "Hapus produk",
    });
    if (!ok) return;
    setDeletingId(id);
    startLoading();
    try {
      const res = await deleteProduk(id);
      if (res?.error) {
        toast.error(res.error, { title: "Tidak bisa menghapus produk" });
      } else {
        toast.success(`Produk "${nama}" berhasil dihapus.`);
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.", { title: "Gagal menghapus produk" });
    } finally {
      setDeletingId(null);
      stopLoading();
    }
  }

  const pageQuery = (page: number) =>
    `/produk?page=${page}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}`;

  return (
    <Card>
      <form className="flex flex-wrap items-end gap-3 border-b border-sand-100 px-5 py-4">
        <label className="flex-1 text-xs font-medium text-sand-500">
          Cari Produk
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Nama, SKU, atau kategori"
            className="mt-1 block w-full rounded-lg border border-sand-300 px-3 py-2 text-sm text-sand-900"
          />
        </label>
        <label className="text-xs font-medium text-sand-500">
          Status
          <Select name="status" defaultValue={sp.status ?? ""} className="mt-1 rounded-lg px-3 py-2 text-sm text-sand-900">
            <option value="">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </Select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Terapkan
        </button>
      </form>

      {produk.length === 0 ? (
        <EmptyState
          title={meta.total === 0 ? "Belum ada Produk di Katalog" : "Tidak ada Produk yang cocok"}
          description={
            meta.total === 0
              ? "Tambahkan Produk pertama Anda — bisa langsung ditempelkan ke Pre-Order manapun setelah ini."
              : "Ubah kata kunci atau filter lalu coba lagi."
          }
          action={meta.total === 0 ? <ProdukModal triggerLabel="+ Produk pertama" /> : undefined}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Dipakai di Batch PO</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {produk.map((p) => (
                  <tr key={p.id} className="hover:bg-sand-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-sand-100" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/produk/${p.id}`} className="font-semibold text-sand-900 hover:underline">
                            {p.nama}
                          </Link>
                          {p.sku && <p className="text-xs text-sand-500">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sand-700">{p.kategori ?? "—"}</td>
                    <td className="px-5 py-3 text-sand-700">{p.jumlahBatchPO}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand-100 text-sand-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-sand-400"}`}
                          aria-hidden="true"
                        />
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ProdukModal
                          produkId={p.id}
                          initial={{
                            nama: p.nama,
                            sku: p.sku ?? undefined,
                            kategori: p.kategori ?? undefined,
                            ukuran: p.ukuran ?? undefined,
                            material: p.material ?? undefined,
                            deskripsi: p.deskripsi ?? undefined,
                            images: p.images,
                            warna: p.warna,
                          }}
                        />
                        <DeleteIconButton
                          onClick={() => handleDelete(p.id, p.nama)}
                          loading={deletingId === p.id}
                          title="Hapus produk"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-sand-100 px-5 py-4 text-sm">
              <Link
                className={meta.page <= 1 ? "pointer-events-none opacity-40" : "text-brand-700 hover:underline"}
                href={pageQuery(meta.page - 1)}
              >
                ← Sebelumnya
              </Link>
              <span>
                Halaman {meta.page} / {meta.totalPages}
              </span>
              <Link
                className={meta.page >= meta.totalPages ? "pointer-events-none opacity-40" : "text-brand-700 hover:underline"}
                href={pageQuery(meta.page + 1)}
              >
                Berikutnya →
              </Link>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
