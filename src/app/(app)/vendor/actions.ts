"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const vendorSchema = z.object({
  nama: z.string().min(1, "Nama vendor wajib diisi"),
  kontak: z.string().optional(),
  spesialisasi: z.string().optional(),
  catatanUmum: z.string().optional(),
});

export type VendorFormState = { error?: string } | undefined;

function parseVendor(formData: FormData) {
  return vendorSchema.safeParse({
    nama: formData.get("nama"),
    kontak: formData.get("kontak") || undefined,
    spesialisasi: formData.get("spesialisasi") || undefined,
    catatanUmum: formData.get("catatanUmum") || undefined,
  });
}

export async function createVendor(
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  await requireUser();
  const parsed = parseVendor(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const vendor = await prisma.vendor.create({ data: parsed.data });
  revalidatePath("/vendor");
  redirect(`/vendor/${vendor.id}`);
}

export async function updateVendor(
  vendorId: string,
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  await requireUser();
  const parsed = parseVendor(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  await prisma.vendor.update({ where: { id: vendorId }, data: parsed.data });
  revalidatePath(`/vendor/${vendorId}`);
  redirect(`/vendor/${vendorId}`);
}

// --- Evaluasi vendor per kampanye (FR-7.3) --------------------------------

const evalSchema = z.object({
  campaignId: z.string().min(1),
  ketepatanWaktu: z.enum(["TEPAT_WAKTU", "TELAT"]),
  jumlahHariTelat: z.coerce.number().int().min(0).optional(),
  kesesuaianKualitas: z.enum(["SESUAI", "TIDAK_SESUAI"]),
  rating: z.coerce.number().int().min(1).max(5),
  catatan: z.string().optional(),
});

export async function saveEvaluation(
  campaignId: string,
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  await requireUser();

  const parsed = evalSchema.safeParse({
    campaignId,
    ketepatanWaktu: formData.get("ketepatanWaktu"),
    jumlahHariTelat: formData.get("jumlahHariTelat") || undefined,
    kesesuaianKualitas: formData.get("kesesuaianKualitas"),
    rating: formData.get("rating"),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { vendorId: true },
  });
  if (!campaign.vendorId) {
    return { error: "Kampanye ini belum punya vendor." };
  }

  const hariTelat = d.ketepatanWaktu === "TELAT" ? (d.jumlahHariTelat ?? 0) : 0;

  // Satu evaluasi per kampanye — upsert.
  await prisma.vendorEvaluation.upsert({
    where: { campaignId },
    create: {
      campaignId,
      vendorId: campaign.vendorId,
      ketepatanWaktu: d.ketepatanWaktu,
      jumlahHariTelat: hariTelat,
      kesesuaianKualitas: d.kesesuaianKualitas,
      rating: d.rating,
      catatan: d.catatan,
    },
    update: {
      ketepatanWaktu: d.ketepatanWaktu,
      jumlahHariTelat: hariTelat,
      kesesuaianKualitas: d.kesesuaianKualitas,
      rating: d.rating,
      catatan: d.catatan,
    },
  });

  revalidatePath(`/kampanye/${campaignId}`);
  revalidatePath(`/vendor/${campaign.vendorId}`);
  return undefined;
}
