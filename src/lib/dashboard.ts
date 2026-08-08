import { prisma } from "@/lib/prisma";
import { computeBilling } from "@/lib/billing";
import { orderAktif } from "@/lib/domain";
import { CampaignStatus, Prisma } from "@/generated/prisma";

/** Ambang "mendekati deadline pelunasan" (FR-6.3) — fixed H-7. */
export const NEAR_DEADLINE_DAYS = 7;

/** Ambang kampanye dianggap "belum diupdate" (FR-6.4). */
export const STALE_TIMELINE_DAYS = 7;

/** Status kampanye yang dianggap masih aktif (belum selesai). */
export const ACTIVE_STATUSES: CampaignStatus[] = [
  "OPEN",
  "CLOSED",
  "PRODUKSI",
  "SIAP_KIRIM",
];

export type DashboardFilters = {
  status?: CampaignStatus;
  dateFrom?: string;
  dateTo?: string;
};

export async function getDashboardData(filters: DashboardFilters) {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Filter kampanye: status (jika dipilih) + rentang tanggal buka.
  const where: Prisma.CampaignWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.tanggalBuka = {};
    if (filters.dateFrom) where.tanggalBuka.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      where.tanggalBuka.lte = to;
    }
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      variants: { select: { kuotaMaks: true } },
      timelineEntries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      orders: {
        include: {
          items: {
            include: { variant: { select: { namaVarian: true } } },
          },
          payments: { select: { jumlah: true, statusVerifikasi: true } },
        },
      },
    },
  });

  // --- Ringkasan kampanye aktif (FR-6.1) --------------------------------
  const activeCampaigns = campaigns
    .filter((c) => ACTIVE_STATUSES.includes(c.status))
    .map((c) => {
      const kuotaTotal = c.variants.reduce((s, v) => s + v.kuotaMaks, 0);
      const terisi = c.orders
        .filter((o) => orderAktif(o.status))
        .reduce(
          (s, o) => s + o.items.reduce((t, it) => t + it.jumlah, 0),
          0,
        );
      const persen = kuotaTotal
        ? Math.round((terisi / kuotaTotal) * 100)
        : 0;
      return {
        id: c.id,
        namaProduk: c.namaProduk,
        status: c.status,
        kuotaTotal,
        terisi,
        persen,
      };
    });

  // --- Cashflow: total dana terverifikasi kampanye aktif (FR-6.2) -------
  let cashflowMasuk = 0;
  let totalNilaiPesanan = 0;
  for (const c of campaigns) {
    if (!ACTIVE_STATUSES.includes(c.status)) continue;
    for (const o of c.orders) {
      if (!orderAktif(o.status)) continue;
      const billing = computeBilling({
        items: o.items,
        paymentScheme: c.paymentScheme,
        dpPercent: c.dpPercent,
        payments: o.payments,
      });
      cashflowMasuk += billing.dibayar;
      totalNilaiPesanan += billing.total;
    }
  }

  // --- Perlu Perhatian: belum lunas & dekat/lewat deadline (FR-6.3) -----
  type PerhatianItem = {
    orderId: string;
    campaignId: string;
    namaPembeli: string;
    namaProduk: string;
    varian: string;
    sisa: number;
    deadline: Date | null;
    hariTersisa: number | null; // negatif = terlewat
    lewat: boolean;
  };
  const perluPerhatian: PerhatianItem[] = [];
  for (const c of campaigns) {
    if (!c.deadlinePelunasan) continue;
    if (!ACTIVE_STATUSES.includes(c.status)) continue;
    const deadline = c.deadlinePelunasan;
    const hariTersisa = Math.ceil((deadline.getTime() - now) / msPerDay);
    if (hariTersisa > NEAR_DEADLINE_DAYS) continue; // masih jauh
    for (const o of c.orders) {
      // BARU_MASUK belum diverifikasi → masuk antrian verifikasi, bukan tagihan.
      if (!orderAktif(o.status) || o.status === "BARU_MASUK") continue;
      const billing = computeBilling({
        items: o.items,
        paymentScheme: c.paymentScheme,
        dpPercent: c.dpPercent,
        payments: o.payments,
      });
      if (billing.sisa <= 0) continue; // sudah lunas
      perluPerhatian.push({
        orderId: o.id,
        campaignId: c.id,
        namaPembeli: o.namaPembeli,
        namaProduk: c.namaProduk,
        varian:
          o.items.length === 1
            ? o.items[0].variant.namaVarian
            : `${o.items.length} varian`,
        sisa: billing.sisa,
        deadline,
        hariTersisa,
        lewat: hariTersisa < 0,
      });
    }
  }
  perluPerhatian.sort(
    (a, b) => (a.hariTersisa ?? 0) - (b.hariTersisa ?? 0),
  );

  // --- Kampanye belum diupdate > 7 hari (FR-6.4) ------------------------
  const staleCampaigns = campaigns
    .filter((c) => ACTIVE_STATUSES.includes(c.status))
    .map((c) => {
      const last = c.timelineEntries[0]?.createdAt ?? c.createdAt;
      const hariLalu = Math.floor((now - last.getTime()) / msPerDay);
      return {
        id: c.id,
        namaProduk: c.namaProduk,
        status: c.status,
        hariLalu,
        lastUpdate: last,
      };
    })
    .filter((c) => c.hariLalu >= STALE_TIMELINE_DAYS)
    .sort((a, b) => b.hariLalu - a.hariLalu);

  return {
    totalCashflow: cashflowMasuk,
    totalNilaiPesanan,
    jumlahKampanyeAktif: activeCampaigns.length,
    activeCampaigns,
    perluPerhatian,
    staleCampaigns,
  };
}

export function persenKuotaColor(persen: number): string {
  if (persen >= 100) return "bg-rose-500";
  if (persen >= 75) return "bg-amber-500";
  return "bg-slate-900";
}
