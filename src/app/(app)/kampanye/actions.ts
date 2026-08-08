"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_ORDER,
} from "@/lib/domain";
import { terisiOneVariant } from "@/lib/quota";
import { generateAccessToken } from "@/lib/token";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/sanitize";
import { CampaignStatus } from "@/generated/prisma";

/** Sanitasi deskripsi rich-text kampanye (v1.6 3.2); kosong → null. */
function normalizeDeskripsi(html?: string): string | null {
  if (!html || isRichTextEmpty(html)) return null;
  return sanitizeRichText(html);
}

const variantSchema = z.object({
  id: z.string().optional(),
  namaVarian: z.string().min(1, "Nama varian wajib diisi"),
  kuotaMaks: z.coerce.number().int().min(1, "Kuota minimal 1"),
  harga: z.coerce.number().min(0, "Harga varian wajib diisi"),
  gambarUrl: z.string().optional(),
});

const campaignSchema = z
  .object({
    namaProduk: z.string().min(1, "Nama produk wajib diisi"),
    deskripsi: z.string().optional(),
    tanggalBuka: z.string().min(1, "Tanggal buka wajib diisi"),
    tanggalTutup: z.string().min(1, "Tanggal tutup wajib diisi"),
    estimasiProduksi: z.string().optional(),
    estimasiKirim: z.string().optional(),
    paymentScheme: z.enum(["DP_PELUNASAN", "LUNAS"]),
    dpPercent: z.coerce.number().int().min(1).max(99).optional(),
    deadlinePelunasan: z.string().optional(),
    vendorId: z.string().optional(),
    variants: z.array(variantSchema).min(1, "Minimal satu varian"),
  })
  .refine(
    (d) => new Date(d.tanggalTutup) >= new Date(d.tanggalBuka),
    { message: "Tanggal tutup harus setelah tanggal buka", path: ["tanggalTutup"] },
  );

export type CampaignFormState = { error?: string } | undefined;

function parseVariants(formData: FormData) {
  const names = formData.getAll("variantNama").map(String);
  const kuotas = formData.getAll("variantKuota").map(String);
  const hargas = formData.getAll("variantHarga").map(String);
  const gambars = formData.getAll("variantGambar").map(String);
  const ids = formData.getAll("variantId").map(String);
  return names
    .map((namaVarian, i) => ({
      id: ids[i] || undefined,
      namaVarian: namaVarian.trim(),
      kuotaMaks: kuotas[i],
      harga: hargas[i] ?? "0",
      gambarUrl: (gambars[i] ?? "").trim() || undefined,
    }))
    .filter((v) => v.namaVarian.length > 0);
}

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();

  const parsed = campaignSchema.safeParse({
    namaProduk: formData.get("namaProduk"),
    deskripsi: formData.get("deskripsi") || undefined,
    tanggalBuka: formData.get("tanggalBuka"),
    tanggalTutup: formData.get("tanggalTutup"),
    estimasiProduksi: formData.get("estimasiProduksi") || undefined,
    estimasiKirim: formData.get("estimasiKirim") || undefined,
    paymentScheme: formData.get("paymentScheme"),
    dpPercent: formData.get("dpPercent") || undefined,
    deadlinePelunasan: formData.get("deadlinePelunasan") || undefined,
    vendorId: formData.get("vendorId") || undefined,
    variants: parseVariants(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      namaProduk: d.namaProduk,
      deskripsi: normalizeDeskripsi(d.deskripsi),
      // v1.5: harga kampanye di-deprecate; simpan harga varian pertama sbagai referensi.
      harga: d.variants[0]?.harga ?? 0,
      tanggalBuka: new Date(d.tanggalBuka),
      tanggalTutup: new Date(d.tanggalTutup),
      estimasiProduksi: toDate(d.estimasiProduksi),
      estimasiKirim: toDate(d.estimasiKirim),
      paymentScheme: d.paymentScheme,
      dpPercent: d.paymentScheme === "DP_PELUNASAN" ? (d.dpPercent ?? 50) : null,
      deadlinePelunasan: toDate(d.deadlinePelunasan),
      vendorId: d.vendorId || null,
      formToken: generateAccessToken(), // v1.2 FR-1.1
      createdById: user.id,
      variants: {
        create: d.variants.map((v) => ({
          namaVarian: v.namaVarian,
          kuotaMaks: v.kuotaMaks,
          harga: v.harga,
          gambarUrl: v.gambarUrl ?? null,
        })),
      },
      timelineEntries: {
        create: {
          judulUpdate: "Kampanye dibuat",
          catatan: `Status awal: ${CAMPAIGN_STATUS_LABEL.OPEN}`,
          otomatis: true,
          dibuatOlehId: user.id,
        },
      },
    },
  });

  revalidatePath("/kampanye");
  redirect(`/kampanye/${campaign.id}`);
}

export async function updateCampaign(
  campaignId: string,
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireUser();

  const parsed = campaignSchema.safeParse({
    namaProduk: formData.get("namaProduk"),
    deskripsi: formData.get("deskripsi") || undefined,
    tanggalBuka: formData.get("tanggalBuka"),
    tanggalTutup: formData.get("tanggalTutup"),
    estimasiProduksi: formData.get("estimasiProduksi") || undefined,
    estimasiKirim: formData.get("estimasiKirim") || undefined,
    paymentScheme: formData.get("paymentScheme"),
    dpPercent: formData.get("dpPercent") || undefined,
    deadlinePelunasan: formData.get("deadlinePelunasan") || undefined,
    vendorId: formData.get("vendorId") || undefined,
    variants: parseVariants(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  // Cegah pengurangan kuota di bawah jumlah yang sudah terisi (oversell mundur).
  for (const v of d.variants) {
    if (!v.id) continue;
    const jumlahTerisi = await terisiOneVariant(prisma, v.id);
    if (v.kuotaMaks < jumlahTerisi) {
      return {
        error: `Kuota varian "${v.namaVarian}" tidak boleh di bawah jumlah terisi (${jumlahTerisi}).`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        namaProduk: d.namaProduk,
        deskripsi: normalizeDeskripsi(d.deskripsi),
        // v1.5: harga kampanye deprecated — tidak diubah dari form.
        tanggalBuka: new Date(d.tanggalBuka),
        tanggalTutup: new Date(d.tanggalTutup),
        estimasiProduksi: toDate(d.estimasiProduksi),
        estimasiKirim: toDate(d.estimasiKirim),
        paymentScheme: d.paymentScheme,
        dpPercent:
          d.paymentScheme === "DP_PELUNASAN" ? (d.dpPercent ?? 50) : null,
        deadlinePelunasan: toDate(d.deadlinePelunasan),
        vendorId: d.vendorId || null,
      },
    });

    // Upsert varian: update yang ada, buat yang baru.
    const keepIds: string[] = [];
    for (const v of d.variants) {
      if (v.id) {
        await tx.variant.update({
          where: { id: v.id },
          data: {
            namaVarian: v.namaVarian,
            kuotaMaks: v.kuotaMaks,
            harga: v.harga,
            gambarUrl: v.gambarUrl ?? null,
            hargaPerluTinjau: false, // admin sudah meninjau harga
          },
        });
        keepIds.push(v.id);
      } else {
        const created = await tx.variant.create({
          data: {
            campaignId,
            namaVarian: v.namaVarian,
            kuotaMaks: v.kuotaMaks,
            harga: v.harga,
            gambarUrl: v.gambarUrl ?? null,
          },
        });
        keepIds.push(created.id);
      }
    }

    // Hapus varian yang dibuang dari form — hanya jika tidak punya item pesanan.
    const removable = await tx.variant.findMany({
      where: { campaignId, id: { notIn: keepIds } },
      include: { _count: { select: { orderItems: true } } },
    });
    for (const v of removable) {
      if (v._count.orderItems === 0) {
        await tx.variant.delete({ where: { id: v.id } });
      }
    }
  });

  revalidatePath(`/kampanye/${campaignId}`);
  redirect(`/kampanye/${campaignId}`);
}

// v1.2 FR-1.7: Admin menyalakan/mematikan formulir publik tanpa ubah status.
export async function toggleFormAktif(campaignId: string, aktif: boolean) {
  await requireUser();
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { formAktif: aktif },
  });
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function addTimelineEntry(campaignId: string, formData: FormData) {
  const user = await requireUser();
  const judulUpdate = String(formData.get("judulUpdate") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();

  if (!judulUpdate) {
    throw new Error("Judul update wajib diisi");
  }

  await prisma.timelineEntry.create({
    data: {
      campaignId,
      judulUpdate,
      catatan: catatan || null,
      otomatis: false,
      dibuatOlehId: user.id,
    },
  });

  revalidatePath(`/kampanye/${campaignId}`);
}

export async function changeCampaignStatus(
  campaignId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const target = String(formData.get("status")) as CampaignStatus;
  const catatan = String(formData.get("catatan") ?? "").trim();

  if (!CAMPAIGN_STATUS_ORDER.includes(target)) {
    throw new Error("Status tidak valid");
  }

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
  });

  if (campaign.status === target) return;

  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaignId },
      data: { status: target },
    }),
    // Auto-entry timeline saat status kampanye berubah (FR-4.3).
    prisma.timelineEntry.create({
      data: {
        campaignId,
        judulUpdate: `Status kampanye: ${CAMPAIGN_STATUS_LABEL[target]}`,
        catatan: catatan || null,
        otomatis: true,
        dibuatOlehId: user.id,
      },
    }),
  ]);

  revalidatePath(`/kampanye/${campaignId}`);
}
