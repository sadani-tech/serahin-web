import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/app/(app)/pesanan/OrderForm";
import { updateOrder } from "@/app/(app)/pesanan/actions";
import { ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { toNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { select: { variantId: true, jumlah: true } },
      campaign: {
        include: {
          variants: {
            orderBy: { createdAt: "asc" },
            include: {
              orderItems: {
                where: {
                  order: { status: { notIn: ORDER_STATUS_NONAKTIF } },
                },
                select: { jumlah: true, orderId: true },
              },
            },
          },
        },
      },
    },
  });
  if (!order) notFound();

  const variantOptions = order.campaign.variants.map((v) => {
    const terisiLain = v.orderItems
      .filter((oi) => oi.orderId !== order.id)
      .reduce((s, oi) => s + oi.jumlah, 0);
    return {
      id: v.id,
      namaVarian: v.namaVarian,
      sisa: v.kuotaMaks - terisiLain,
      harga: toNumber(v.harga),
    };
  });

  const action = updateOrder.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/pesanan/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Kembali ke pesanan
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
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
          })),
        }}
      />
    </div>
  );
}
