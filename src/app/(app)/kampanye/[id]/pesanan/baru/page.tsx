import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/app/(app)/pesanan/OrderForm";
import { createOrder } from "@/app/(app)/pesanan/actions";
import { campaignMenerimaPesanan, ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { toNumber } from "@/lib/format";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TambahPesananPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
        include: {
          orderItems: {
            where: { order: { status: { notIn: ORDER_STATUS_NONAKTIF } } },
            select: { jumlah: true },
          },
        },
      },
    },
  });
  if (!campaign) notFound();

  const bisaPesan = campaignMenerimaPesanan(campaign.status);

  const variantOptions = campaign.variants.map((v) => {
    const terisi = v.orderItems.reduce((s, o) => s + o.jumlah, 0);
    return {
      id: v.id,
      namaVarian: v.namaVarian,
      sisa: v.kuotaMaks - terisi,
      harga: toNumber(v.harga),
    };
  });

  const action = createOrder.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/kampanye/${id}?tab=pesanan`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke kampanye
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Tambah Pesanan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {campaign.namaProduk}
        </p>
      </div>

      {!bisaPesan ? (
        <Card className="p-6">
          <p className="text-sm text-rose-700">
            Kampanye ini berstatus bukan <b>Open</b>, sehingga tidak dapat
            menerima pesanan baru (FR-1.6).
          </p>
        </Card>
      ) : (
        <OrderForm
          action={action}
          variants={variantOptions}
          submitLabel="Simpan Pesanan"
        />
      )}
    </div>
  );
}
