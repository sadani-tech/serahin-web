import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ProdukForm } from "../ProdukForm";
import { updateProduk } from "../actions";
import { ProdukActiveToggle } from "./ProdukActiveToggle";

export const dynamic = "force-dynamic";

const SALES_EVENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Terjadwal",
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

type ProdukDetail = {
  id: string;
  nama: string;
  sku: string | null;
  kategori: string | null;
  ukuran: string | null;
  material: string | null;
  images: string[];
  warna: string[];
  deskripsi: string | null;
  isActive: boolean;
  jumlahBatchPO: number;
  riwayatPemakaian: {
    salesEventId: string;
    namaBatchPO: string;
    status: string;
    tanggalBuka: string;
    tanggalTutup: string;
    harga: string;
    kuotaMaks: number;
    terisi: number;
  }[];
};

export default async function ProdukDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let produk: ProdukDetail;
  try {
    produk = await api.get<ProdukDetail>(`/produk/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/produk" className="text-sm text-sand-500 hover:text-sand-700">
          ← Daftar Produk
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
              {produk.nama}
            </h1>
            <p className="mt-1 text-sm text-sand-500">
              {produk.kategori ?? "Tanpa kategori"}
              {produk.sku ? ` · SKU ${produk.sku}` : ""}
              {" · "}Dipakai di {produk.jumlahBatchPO} Batch PO
            </p>
          </div>
          <ProdukActiveToggle produkId={produk.id} isActive={produk.isActive} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProdukForm
            action={updateProduk.bind(null, produk.id)}
            initial={{
              nama: produk.nama,
              sku: produk.sku ?? undefined,
              kategori: produk.kategori ?? undefined,
              ukuran: produk.ukuran ?? undefined,
              material: produk.material ?? undefined,
              deskripsi: produk.deskripsi ?? undefined,
              images: produk.images,
              warna: produk.warna,
            }}
            submitLabel="Simpan Perubahan"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Riwayat Pemakaian" subtitle="Batch PO mana saja yang memakai Produk ini" />
            {produk.riwayatPemakaian.length === 0 ? (
              <EmptyState
                title="Belum pernah dipakai"
                description="Tempelkan Produk ini ke sebuah Batch PO lewat tab Produk saat mengedit Pre-Order."
                action={<LinkButton href="/pre-orders" variant="secondary">Lihat Pre-Order</LinkButton>}
              />
            ) : (
              <ul className="divide-y divide-sand-100 px-5">
                {produk.riwayatPemakaian.map((r) => (
                  <li key={r.salesEventId} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/pre-orders/${r.salesEventId}`} className="font-medium text-sand-900 hover:underline">
                        {r.namaBatchPO}
                      </Link>
                      <span className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-sand-700 ring-1 ring-inset ring-sand-500/25">
                        {SALES_EVENT_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-sand-500">
                      {formatTanggal(r.tanggalBuka)} – {formatTanggal(r.tanggalTutup)}
                    </p>
                    <p className="mt-1 text-sm text-sand-700">
                      {formatRupiah(r.harga)} · Kuota {r.terisi}/{r.kuotaMaks}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
