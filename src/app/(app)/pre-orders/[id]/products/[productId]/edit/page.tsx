import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { notFound } from "next/navigation";
import { updatePreorderProduct } from "../../../../actions";
import { ProductEditor, type ProductEditorValues } from "../../ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;
  let campaign: {
    vendors: { id: string; nama: string }[];
    paymentScheme?: "DP_PELUNASAN" | "LUNAS";
    dpTipe?: "PERSEN" | "NOMINAL" | null;
    dpPercent?: number | null;
    dpNominal?: string | number | null;
  };
  let product: ProductEditorValues;
  try {
    [campaign, product] = await Promise.all([
      api.get<typeof campaign>(`/pre-orders/${id}`),
      api.get<ProductEditorValues>(`/pre-orders/${id}/products/${productId}`),
    ]);
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
          Edit Produk
        </h1>
      </div>
      <ProductEditor
        action={updatePreorderProduct.bind(null, id, productId)}
        initial={product}
        vendors={campaign.vendors}
        campaignId={id}
        submitLabel="Simpan Produk"
        campaignDp={campaign}
      />
    </div>
  );
}
