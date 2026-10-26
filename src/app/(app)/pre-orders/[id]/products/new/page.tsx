import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { notFound } from "next/navigation";
import { createPreorderProduct } from "../../../actions";
import { ProductEditor } from "../ProductEditor";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let campaign: {
    vendors: { id: string; nama: string }[];
    paymentScheme?: "DP_PELUNASAN" | "LUNAS";
    dpTipe?: "PERSEN" | "NOMINAL" | null;
    dpPercent?: number | null;
    dpNominal?: string | number | null;
  };
  try {
    campaign = await api.get<typeof campaign>(`/pre-orders/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/pre-orders/${id}?tab=produk`}
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Kembali ke Produk
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-sand-900">
          Tambah Produk
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Produk disimpan terpisah dari informasi Batch PO.
        </p>
      </div>
      <ProductEditor
        action={createPreorderProduct.bind(null, id)}
        vendors={campaign.vendors}
        campaignId={id}
        submitLabel="Tambah Produk"
        campaignDp={campaign}
      />
    </div>
  );
}
