"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { normalizeVarian } from "@/lib/import/status";
import { parseLegacyFile } from "@/lib/import/legacy";
import { executeImport, type OrderPlan } from "@/lib/import/execute";
import type { VariantCatalogItem } from "@/lib/import/validate";
import { OrderStatus, PaymentVerification } from "@/generated/prisma";
import { MAX_BARIS_IMPORT, type ImportUploadState } from "./constants";

const ALLOWED_STATUS: OrderStatus[] = [
  "MENUNGGU_DP",
  "DP_DITERIMA",
  "LUNAS",
  "PRODUKSI",
  "SIAP_KIRIM",
  "DIKIRIM",
  "SELESAI",
];

export async function uploadLegacy(
  campaignId: string,
  _prev: ImportUploadState,
  formData: FormData,
): Promise<ImportUploadState> {
  const user = await requireUser();

  const dpNominal = Number(formData.get("dpNominal"));
  if (!Number.isFinite(dpNominal) || dpNominal <= 0) {
    return { error: "Nominal DP flat harus lebih dari 0." };
  }
  const defaultStatus = String(formData.get("defaultStatus")) as OrderStatus;
  if (!ALLOWED_STATUS.includes(defaultStatus)) {
    return { error: "Status default tidak valid." };
  }
  const verifikasi = String(
    formData.get("verifikasi") ?? "TERVERIFIKASI",
  ) as PaymentVerification;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File mentah wajib diunggah." };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { variants: { select: { id: true, namaVarian: true, kuotaMaks: true } } },
  });
  if (!campaign) return { error: "Kampanye tujuan tidak ditemukan." };

  const catalog: VariantCatalogItem[] = campaign.variants.map((v) => ({
    id: v.id,
    namaVarian: v.namaVarian,
    kuotaMaks: v.kuotaMaks,
  }));

  let draftId: string;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const rows = parseLegacyFile(buf, catalog);
    if (rows.length === 0) return { error: "File kosong / tidak terbaca." };
    if (rows.length > MAX_BARIS_IMPORT) {
      return { error: `Terlalu banyak baris (maks ${MAX_BARIS_IMPORT}).` };
    }
    const draft = await prisma.importDraft.create({
      data: {
        mode: "LEGACY",
        namaFile: file.name,
        targetCampaignId: campaignId,
        data: { dpNominal, defaultStatus, verifikasi, rows } as unknown as object,
        createdById: user.id,
      },
    });
    draftId = draft.id;
  } catch (e) {
    return {
      error: e instanceof Error ? `Gagal parsing: ${e.message}` : "Gagal parsing file.",
    };
  }

  redirect(`/import/legacy/preview/${draftId}`);
}

export type LegacyConfirmState = { error?: string } | undefined;

export async function confirmLegacy(
  draftId: string,
  _prev: LegacyConfirmState,
  formData: FormData,
): Promise<LegacyConfirmState> {
  const user = await requireUser();
  const draft = await prisma.importDraft.findUnique({ where: { id: draftId } });
  if (!draft || draft.mode !== "LEGACY" || !draft.targetCampaignId) {
    return { error: "Draft legacy tidak ditemukan." };
  }

  const data = draft.data as unknown as {
    dpNominal: number;
    defaultStatus: OrderStatus;
    verifikasi: PaymentVerification;
    rows: {
      index: number;
      nama: string;
      kontak: string;
      varianInput: string;
      variantId: string | null;
      jumlah: number;
      rawBukti: string;
      needsManualVarian: boolean;
    }[];
  };

  // Validasi kampanye + varian valid untuk resolusi manual.
  const campaign = await prisma.campaign.findUnique({
    where: { id: draft.targetCampaignId },
    include: { variants: { select: { id: true } } },
  });
  if (!campaign) return { error: "Kampanye tujuan tidak ada." };
  const validVariantIds = new Set(campaign.variants.map((v) => v.id));

  const orders: OrderPlan[] = [];
  let dilewati = 0;

  for (const row of data.rows) {
    // Resolusi: auto (variantId) atau input manual varian_<index> ("SKIP" untuk lewati).
    const manual = String(formData.get(`varian_${row.index}`) ?? "");
    let variantId = row.variantId;
    if (row.needsManualVarian) {
      if (manual === "SKIP") {
        dilewati++;
        continue;
      }
      if (!manual || !validVariantIds.has(manual)) {
        return {
          error: `Baris ${row.index + 1} belum dipilih variannya. Pilih varian atau lewati.`,
        };
      }
      variantId = manual;
    }
    if (!variantId) {
      dilewati++;
      continue;
    }

    // v1.5: hitung harga item dari varian tujuan (price snapshot).
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { harga: true },
    });
    orders.push({
      namaPembeli: row.nama,
      kontak: row.kontak,
      status: data.defaultStatus,
      items: [
        {
          variantId,
          jumlah: row.jumlah,
          hargaSaatPesan: variant ? Number(variant.harga) : 0,
        },
      ],
      payments: [
        {
          jenis: "DP",
          jumlah: data.dpNominal,
          buktiFile: row.rawBukti || null,
          verifikasi: data.verifikasi,
        },
      ],
    });
  }

  if (orders.length === 0) {
    return { error: "Tidak ada baris yang bisa diimpor." };
  }

  const logId = await executeImport({
    mode: "LEGACY",
    namaFile: draft.namaFile,
    createdById: user.id,
    targetCampaignId: draft.targetCampaignId,
    jumlahDilewati: dilewati,
    orders,
  });
  await prisma.importDraft.delete({ where: { id: draftId } });

  revalidatePath("/import/riwayat");
  revalidatePath(`/kampanye/${draft.targetCampaignId}`);
  redirect(`/import/riwayat?sukses=${logId}`);
}
