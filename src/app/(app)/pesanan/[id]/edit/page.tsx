import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { OrderForm } from "@/app/(app)/pesanan/OrderForm";
import { updateOrder } from "@/app/(app)/pesanan/actions";
import { toNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

type OrderDetail = {
  namaPembeli: string;
  kontak: string;
  catatan: string | null;
  items: { variantId: string; jumlah: number; warna: string | null }[];
  campaign: { id: string };
};

type CampaignDetail = {
  variants: {
    id: string;
    namaVarian: string;
    sisa: number;
    harga: string;
    warna: string[];
  }[];
};

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order: OrderDetail;
  try {
    order = await api.get<OrderDetail>(`/pesanan/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const campaign = await api.get<CampaignDetail>(
    `/kampanye/${order.campaign.id}`,
  );

  // Sisa global + kembalikan jumlah milik pesanan ini (agar bisa dipertahankan).
  const jumlahIni = new Map<string, number>();
  for (const it of order.items) {
    jumlahIni.set(it.variantId, (jumlahIni.get(it.variantId) ?? 0) + it.jumlah);
  }
  const variantOptions = campaign.variants.map((v) => ({
    id: v.id,
    namaVarian: v.namaVarian,
    sisa: v.sisa + (jumlahIni.get(v.id) ?? 0),
    harga: toNumber(v.harga),
    warna: v.warna ?? [],
  }));

  const action = updateOrder.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/pesanan/${id}`}
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Kembali ke pesanan
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Edit Pesanan
        </h1>
      </div>

      <OrderForm
        action={action}
        variants={variantOptions}
        submitLabel="Simpan Perubahan"
        initial={{
          namaPembeli: order.namaPembeli,
          kontak: order.kontak,
          catatan: order.catatan ?? undefined,
          items: order.items.map((it) => ({
            variantId: it.variantId,
            jumlah: it.jumlah,
            warna: it.warna ?? undefined,
          })),
        }}
      />
    </div>
  );
}
