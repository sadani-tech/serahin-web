import { api } from "@/lib/api";
import ProdukTable from "@/components/ProdukTable";
import { ProdukModal } from "./ProdukModal";

export const dynamic = "force-dynamic";

export type ProdukRow = {
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
};

type ProdukEnvelope = { data: ProdukRow[]; meta: { total: number; page: number; limit: number; totalPages: number } };

export default async function ProdukListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;
  const produk = await api.get<ProdukEnvelope>("/produk", {
    q: sp.q || undefined,
    status: sp.status || undefined,
    page,
    limit: 20,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
            Produk
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Katalog produk reusable — buat sekali, tempelkan ke Pre-Order manapun yang Anda mau.
          </p>
        </div>
        <ProdukModal />
      </div>

      <ProdukTable produk={produk.data} meta={produk.meta} sp={sp} />
    </div>
  );
}
