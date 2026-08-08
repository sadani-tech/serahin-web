import { prisma } from "@/lib/prisma";
import { ImportMode } from "@/generated/prisma";
import { ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { toNumber } from "@/lib/format";
import { readWorkbook, sheetRows, firstSheetRows } from "./parse";
import { normalizeVarian } from "./status";
import {
  validateImport,
  type ParsedSheets,
  type ValidationResult,
  type VariantCatalogItem,
} from "./validate";
import type { CommitPlan, OrderPlan } from "./execute";

/** Ekstrak ParsedSheets dari buffer file sesuai mode. */
export function parseFileToSheets(buf: Buffer, mode: ImportMode): ParsedSheets {
  const wb = readWorkbook(buf);
  if (mode === "KAMPANYE_PENUH") {
    return {
      kampanye: sheetRows(wb, "Kampanye"),
      varian: sheetRows(wb, "Varian"),
      pesanan: sheetRows(wb, "Pesanan"),
      itemPesanan: sheetRows(wb, "Item Pesanan"),
      pembayaran: sheetRows(wb, "Pembayaran"),
    };
  }
  if (mode === "PESANAN") {
    return {
      kampanye: [],
      varian: [],
      pesanan: sheetRows(wb, "Pesanan"),
      itemPesanan: sheetRows(wb, "Item Pesanan"),
      pembayaran: sheetRows(wb, "Pembayaran"),
    };
  }
  return {
    kampanye: [],
    varian: [],
    pesanan: firstSheetRows(wb),
    itemPesanan: [],
    pembayaran: [],
  };
}

/** Jalankan validasi untuk draft (memuat katalog varian dari DB untuk Mode B). */
export async function getValidationForDraft(draft: {
  mode: ImportMode;
  targetCampaignId: string | null;
  data: unknown;
}): Promise<ValidationResult> {
  const sheets = draft.data as ParsedSheets;

  let variants: VariantCatalogItem[] = [];
  const existingTerisi: Record<string, number> = {};

  if (draft.mode === "KAMPANYE_PENUH") {
    variants = sheets.varian.map((r) => ({
      namaVarian: String(r["nama_varian"] ?? r["nama varian"] ?? r["varian"] ?? ""),
      kuotaMaks: Number(r["kuota_maks"] ?? r["kuota"] ?? 0),
      harga: Number(r["harga"] ?? 0),
    }));
  } else if (draft.targetCampaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: draft.targetCampaignId },
      include: {
        variants: {
          include: {
            orderItems: {
              where: { order: { status: { notIn: ORDER_STATUS_NONAKTIF } } },
              select: { jumlah: true },
            },
          },
        },
      },
    });
    if (campaign) {
      variants = campaign.variants.map((v) => ({
        id: v.id,
        namaVarian: v.namaVarian,
        kuotaMaks: v.kuotaMaks,
        harga: toNumber(v.harga),
      }));
      for (const v of campaign.variants) {
        existingTerisi[normalizeVarian(v.namaVarian)] = v.orderItems.reduce(
          (s, oi) => s + oi.jumlah,
          0,
        );
      }
    }
  }

  const kuotaMaksByKey: Record<string, number> = {};
  for (const v of variants) kuotaMaksByKey[normalizeVarian(v.namaVarian)] = v.kuotaMaks;

  return validateImport({
    mode: draft.mode,
    sheets,
    variants,
    existingTerisi,
    kuotaMaksByKey,
  });
}

/** Bangun CommitPlan dari hasil validasi (hanya baris valid). */
export function buildCommitPlan(
  validation: ValidationResult,
  draft: {
    mode: ImportMode;
    namaFile: string;
    targetCampaignId: string | null;
  },
  createdById: string,
): CommitPlan {
  // Item valid per pesanan.
  const itemsByRef = new Map<
    string,
    { variantId: string | null; variantKey: string | null; jumlah: number; hargaSaatPesan: number }[]
  >();
  for (const it of validation.items) {
    if (it.errors.length > 0) continue;
    const arr = itemsByRef.get(it.idRefPesanan) ?? [];
    arr.push({
      variantId: it.variantId,
      variantKey: it.variantKey,
      jumlah: it.jumlah,
      hargaSaatPesan: it.hargaSaatPesan,
    });
    itemsByRef.set(it.idRefPesanan, arr);
  }

  // Pembayaran valid per pesanan.
  const bayarByRef = new Map<
    string,
    { jenis: NonNullable<(typeof validation.pembayaran)[number]["jenis"]>; jumlah: number; tanggal: string | null }[]
  >();
  for (const p of validation.pembayaran) {
    if (p.errors.length > 0 || !p.jenis || p.jumlah == null) continue;
    const arr = bayarByRef.get(p.idRefPesanan) ?? [];
    arr.push({ jenis: p.jenis, jumlah: p.jumlah, tanggal: p.tanggal });
    bayarByRef.set(p.idRefPesanan, arr);
  }

  const orders: OrderPlan[] = validation.pesanan
    .filter((p) => p.errors.length === 0)
    .map((p) => ({
      namaPembeli: p.namaPembeli,
      kontak: p.kontak,
      status: p.status,
      catatan: p.catatan || null,
      items: (itemsByRef.get(p.idRef) ?? []).map((it) => ({
        variantId: it.variantId ?? undefined,
        variantKey: it.variantId ? undefined : (it.variantKey ?? undefined),
        jumlah: it.jumlah,
        hargaSaatPesan: it.hargaSaatPesan,
      })),
      payments: (bayarByRef.get(p.idRef) ?? []).map((pay) => ({
        jenis: pay.jenis,
        jumlah: pay.jumlah,
        tanggal: pay.tanggal,
        verifikasi: "TERVERIFIKASI" as const,
      })),
    }));

  const plan: CommitPlan = {
    mode: draft.mode,
    namaFile: draft.namaFile,
    createdById,
    targetCampaignId: draft.targetCampaignId ?? undefined,
    jumlahDilewati: validation.ringkasan.pesananError,
    orders,
  };

  if (draft.mode === "KAMPANYE_PENUH" && validation.kampanye) {
    const k = validation.kampanye;
    plan.kampanye = {
      namaProduk: k.namaProduk,
      deskripsi: k.deskripsi || null,
      harga: k.harga,
      tanggalBuka: k.tanggalBuka ?? new Date().toISOString(),
      tanggalTutup: k.tanggalTutup ?? new Date().toISOString(),
      estimasiProduksi: k.estimasiProduksi,
      estimasiKirim: k.estimasiKirim,
      paymentScheme: k.paymentScheme,
      dpPercent: k.dpPercent,
      deadlinePelunasan: k.deadlinePelunasan,
    };
    plan.varian = validation.varian
      .filter((v) => v.errors.length === 0)
      .map((v) => ({
        namaVarian: v.namaVarian,
        kuotaMaks: v.kuotaMaks,
        harga: v.harga,
        gambarUrl: v.gambarUrl,
      }));
  }

  return plan;
}
