import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import {
  PAYMENT_TYPE_LABEL,
  PAYMENT_VERIFICATION_LABEL,
} from "@/lib/domain";
import { Prisma } from "@/generated/prisma";
import { OrderFilters } from "./query";

/** Where Prisma untuk Payment berdasarkan filter (kampanye/tanggal/verifikasi). */
function paymentWhere(f: OrderFilters): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};
  if (f.verifikasi) where.statusVerifikasi = f.verifikasi;
  if (f.campaignId) where.order = { campaignId: f.campaignId };
  if (f.dateFrom || f.dateTo) {
    where.tanggal = {};
    if (f.dateFrom) where.tanggal.gte = f.dateFrom;
    if (f.dateTo) where.tanggal.lte = f.dateTo;
  }
  return where;
}

async function fetchPayments(f: OrderFilters) {
  return prisma.payment.findMany({
    where: paymentWhere(f),
    orderBy: { tanggal: "asc" },
    include: {
      order: {
        select: {
          id: true,
          namaPembeli: true,
          kontak: true,
          campaign: { select: { namaProduk: true } },
        },
      },
    },
  });
}

/** Baris rekap keuangan per-transaksi (v1.6 4.2) untuk Excel/CSV. */
export async function buildKeuanganRows(f: OrderFilters) {
  const payments = await fetchPayments(f);
  return payments.map((p) => ({
    Kampanye: p.order.campaign.namaProduk,
    "ID Pesanan": p.order.id,
    "Nama Pembeli": p.order.namaPembeli,
    Kontak: p.order.kontak,
    "Jenis Pembayaran": PAYMENT_TYPE_LABEL[p.jenis],
    Jumlah: toNumber(p.jumlah),
    Tanggal: p.tanggal.toISOString().slice(0, 10),
    "Status Verifikasi": PAYMENT_VERIFICATION_LABEL[p.statusVerifikasi],
  }));
}

export type KeuanganSummary = {
  totalTransaksi: number;
  totalTerverifikasi: number;
  totalMenunggu: number;
  totalDitolak: number;
  perKampanye: {
    kampanye: string;
    jumlahTransaksi: number;
    totalTerverifikasi: number;
  }[];
};

/** Ringkasan visual untuk PDF (v1.6 4.2). */
export async function buildKeuanganSummary(
  f: OrderFilters,
): Promise<KeuanganSummary> {
  const payments = await fetchPayments(f);

  let totalTerverifikasi = 0;
  let totalMenunggu = 0;
  let totalDitolak = 0;
  const perKampanye = new Map<
    string,
    { jumlahTransaksi: number; totalTerverifikasi: number }
  >();

  for (const p of payments) {
    const nilai = toNumber(p.jumlah);
    if (p.statusVerifikasi === "TERVERIFIKASI") totalTerverifikasi += nilai;
    else if (p.statusVerifikasi === "MENUNGGU_VERIFIKASI") totalMenunggu += nilai;
    else if (p.statusVerifikasi === "DITOLAK") totalDitolak += nilai;

    const key = p.order.campaign.namaProduk;
    const agg = perKampanye.get(key) ?? {
      jumlahTransaksi: 0,
      totalTerverifikasi: 0,
    };
    agg.jumlahTransaksi += 1;
    if (p.statusVerifikasi === "TERVERIFIKASI") agg.totalTerverifikasi += nilai;
    perKampanye.set(key, agg);
  }

  return {
    totalTransaksi: payments.length,
    totalTerverifikasi,
    totalMenunggu,
    totalDitolak,
    perKampanye: [...perKampanye.entries()]
      .map(([kampanye, v]) => ({ kampanye, ...v }))
      .sort((a, b) => b.totalTerverifikasi - a.totalTerverifikasi),
  };
}
