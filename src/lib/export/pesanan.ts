import { prisma } from "@/lib/prisma";
import { computeBilling } from "@/lib/billing";
import { toNumber } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/domain";
import { OrderFilters, orderWhere } from "./query";

function tanggalIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Baris ekspor pesanan (v1.6 4.1) — satu baris per item keranjang (v1.5),
 * dengan total/terbayar/sisa level pesanan diulang pada tiap item.
 */
export async function buildPesananRows(filters: OrderFilters) {
  const orders = await prisma.order.findMany({
    where: orderWhere(filters),
    orderBy: { createdAt: "asc" },
    include: {
      campaign: {
        select: { namaProduk: true, paymentScheme: true, dpPercent: true },
      },
      items: {
        include: { variant: { select: { namaVarian: true } } },
      },
      payments: { select: { jumlah: true, statusVerifikasi: true } },
    },
  });

  const rows: Record<string, unknown>[] = [];
  for (const o of orders) {
    const billing = computeBilling({
      items: o.items,
      paymentScheme: o.campaign.paymentScheme,
      dpPercent: o.campaign.dpPercent,
      payments: o.payments,
    });
    if (o.items.length === 0) {
      rows.push(baseRow(o, billing, tanggalIso));
      continue;
    }
    for (const it of o.items) {
      rows.push({
        ...baseRow(o, billing, tanggalIso),
        Varian: it.variant.namaVarian,
        Jumlah: it.jumlah,
        "Harga Satuan": toNumber(it.hargaSaatPesan),
        Subtotal: toNumber(it.hargaSaatPesan) * it.jumlah,
      });
    }
  }
  return rows;
}

function baseRow(
  o: {
    id: string;
    namaPembeli: string;
    kontak: string;
    status: keyof typeof ORDER_STATUS_LABEL;
    createdAt: Date;
    campaign: { namaProduk: string };
  },
  billing: { total: number; dibayar: number; sisa: number },
  tanggalIso: (d: Date) => string,
): Record<string, unknown> {
  return {
    Kampanye: o.campaign.namaProduk,
    "ID Pesanan": o.id,
    "Nama Pembeli": o.namaPembeli,
    Kontak: o.kontak,
    Status: ORDER_STATUS_LABEL[o.status],
    Tanggal: tanggalIso(o.createdAt),
    Varian: "",
    Jumlah: "",
    "Harga Satuan": "",
    Subtotal: "",
    "Total Pesanan": billing.total,
    Terbayar: billing.dibayar,
    Sisa: billing.sisa,
  };
}
