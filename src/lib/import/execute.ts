import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/token";
import { normalizeVarian } from "./status";
import {
  ImportMode,
  OrderStatus,
  PaymentType,
  PaymentVerification,
  Prisma,
} from "@/generated/prisma";

export type PaymentPlan = {
  jenis: PaymentType;
  jumlah: number;
  tanggal?: string | null;
  buktiFile?: string | null;
  verifikasi?: PaymentVerification;
};

// v1.5: item keranjang dalam satu pesanan hasil import.
export type OrderItemPlan = {
  variantId?: string; // Mode B / Legacy (varian sudah ada)
  variantKey?: string; // Mode A (dicocokkan ke varian baru dibuat)
  jumlah: number;
  hargaSaatPesan: number; // price snapshot (FR-2.3)
};

export type OrderPlan = {
  namaPembeli: string;
  kontak: string;
  status: OrderStatus;
  catatan?: string | null;
  items: OrderItemPlan[];
  payments: PaymentPlan[];
};

export type CommitPlan = {
  mode: ImportMode;
  namaFile: string;
  createdById: string;
  targetCampaignId?: string;
  jumlahDilewati: number;
  // Mode A:
  kampanye?: {
    namaProduk: string;
    deskripsi?: string | null;
    harga: number; // harga kampanye (deprecated, referensi)
    tanggalBuka: string;
    tanggalTutup: string;
    estimasiProduksi?: string | null;
    estimasiKirim?: string | null;
    paymentScheme: "DP_PELUNASAN" | "LUNAS";
    dpPercent?: number | null;
    deadlinePelunasan?: string | null;
  };
  varian?: { namaVarian: string; kuotaMaks: number; harga: number; gambarUrl?: string | null }[];
  orders: OrderPlan[];
};

const dt = (v?: string | null) => (v ? new Date(v) : null);

/** Commit satu sesi import dalam satu transaksi (FR-3.1). */
export async function executeImport(plan: CommitPlan): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const log = await tx.importLog.create({
      data: {
        mode: plan.mode,
        namaFile: plan.namaFile,
        createdById: plan.createdById,
        targetCampaignId:
          plan.mode === "KAMPANYE_PENUH" ? null : (plan.targetCampaignId ?? null),
        jumlahSukses: plan.orders.length,
        jumlahDilewati: plan.jumlahDilewati,
        status: "BERHASIL",
      },
    });

    let campaignId: string;
    const keyToVariantId = new Map<string, string>();

    if (plan.mode === "KAMPANYE_PENUH") {
      if (!plan.kampanye) throw new Error("Data kampanye tidak ada (Mode A).");
      const k = plan.kampanye;
      const campaign = await tx.campaign.create({
        data: {
          namaProduk: k.namaProduk,
          deskripsi: k.deskripsi ?? null,
          harga: new Prisma.Decimal(k.harga),
          tanggalBuka: new Date(k.tanggalBuka),
          tanggalTutup: new Date(k.tanggalTutup),
          estimasiProduksi: dt(k.estimasiProduksi),
          estimasiKirim: dt(k.estimasiKirim),
          paymentScheme: k.paymentScheme,
          dpPercent: k.paymentScheme === "DP_PELUNASAN" ? (k.dpPercent ?? 50) : null,
          deadlinePelunasan: dt(k.deadlinePelunasan),
          status: "SELESAI",
          sumberKampanye: "IMPORT",
          importLogId: log.id,
          formToken: generateAccessToken(),
          formAktif: false,
          createdById: plan.createdById,
        },
      });
      campaignId = campaign.id;

      for (const v of plan.varian ?? []) {
        const created = await tx.variant.create({
          data: {
            campaignId,
            namaVarian: v.namaVarian,
            kuotaMaks: v.kuotaMaks,
            harga: new Prisma.Decimal(v.harga),
            gambarUrl: v.gambarUrl ?? null,
          },
        });
        keyToVariantId.set(normalizeVarian(v.namaVarian), created.id);
      }
    } else {
      if (!plan.targetCampaignId)
        throw new Error("Kampanye tujuan tidak ditentukan (Mode B/Legacy).");
      campaignId = plan.targetCampaignId;
    }

    for (const o of plan.orders) {
      const itemsData = o.items.map((it) => {
        const variantId =
          it.variantId ??
          (it.variantKey ? keyToVariantId.get(it.variantKey) : undefined);
        if (!variantId) {
          throw new Error(
            `Varian tidak dapat diresolusi untuk pesanan "${o.namaPembeli || o.kontak}".`,
          );
        }
        return {
          variantId,
          jumlah: it.jumlah,
          hargaSaatPesan: new Prisma.Decimal(it.hargaSaatPesan),
        };
      });
      if (itemsData.length === 0) continue;

      await tx.order.create({
        data: {
          campaignId,
          namaPembeli: o.namaPembeli,
          kontak: o.kontak,
          status: o.status,
          catatan: o.catatan ?? null,
          sumberPesanan: "IMPORT", // FR-3.3
          tokenAkses: generateAccessToken(), // FR-3.2
          importLogId: log.id,
          items: { create: itemsData },
          statusLogs: {
            create: {
              statusLama: null,
              statusBaru: o.status,
              catatan: "Diimpor dari data historis",
              dibuatOlehId: plan.createdById,
            },
          },
          payments: {
            create: o.payments.map((p) => ({
              jenis: p.jenis,
              jumlah: new Prisma.Decimal(p.jumlah),
              tanggal: p.tanggal ? new Date(p.tanggal) : new Date(),
              buktiFile: p.buktiFile ?? null,
              statusVerifikasi: p.verifikasi ?? "TERVERIFIKASI",
            })),
          },
        },
      });
    }

    await tx.timelineEntry.create({
      data: {
        campaignId,
        judulUpdate: "Data historis diimpor",
        catatan: `Diimpor dari "${plan.namaFile}" (${plan.orders.length} pesanan) oleh Admin.`,
        otomatis: true,
        dibuatOlehId: plan.createdById,
      },
    });

    return log.id;
  });
}

/** Rollback satu sesi import (FR-3.6). */
export async function rollbackImport(
  importLogId: string,
): Promise<{ error?: string }> {
  const log = await prisma.importLog.findUnique({
    where: { id: importLogId },
    include: { orders: { select: { id: true } } },
  });
  if (!log) return { error: "Sesi import tidak ditemukan." };
  if (log.status === "DIROLLBACK")
    return { error: "Sesi ini sudah dirollback." };

  const orderIds = log.orders.map((o) => o.id);
  const batas = new Date(log.createdAt.getTime() + 5000);
  const [logLanjutan, bayarLanjutan] = await Promise.all([
    prisma.orderStatusLog.count({
      where: { orderId: { in: orderIds }, createdAt: { gt: batas } },
    }),
    prisma.payment.count({
      where: { orderId: { in: orderIds }, createdAt: { gt: batas } },
    }),
  ]);
  if (logLanjutan > 0 || bayarLanjutan > 0) {
    return {
      error:
        "Tidak bisa rollback: sudah ada perubahan lanjutan (status/pembayaran) pada pesanan hasil import ini.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.deleteMany({ where: { importLogId } });
    await tx.campaign.deleteMany({ where: { importLogId } });
    await tx.importLog.update({
      where: { id: importLogId },
      data: { status: "DIROLLBACK", rolledBackAt: new Date() },
    });
  });

  return {};
}
