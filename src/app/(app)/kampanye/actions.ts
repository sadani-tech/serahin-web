"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

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
      kuotaMaks: Number(kuotas[i] ?? 0),
      harga: Number(hargas[i] ?? 0),
      gambarUrl: (gambars[i] ?? "").trim() || undefined,
    }))
    .filter((v) => v.namaVarian.length > 0);
}

function campaignBody(formData: FormData) {
  const dpPercentRaw = formData.get("dpPercent");
  return {
    namaProduk: String(formData.get("namaProduk") ?? ""),
    deskripsi: (formData.get("deskripsi") as string) || undefined,
    tanggalBuka: String(formData.get("tanggalBuka") ?? ""),
    tanggalTutup: String(formData.get("tanggalTutup") ?? ""),
    estimasiProduksi: (formData.get("estimasiProduksi") as string) || undefined,
    estimasiKirim: (formData.get("estimasiKirim") as string) || undefined,
    paymentScheme: String(formData.get("paymentScheme") ?? "DP_PELUNASAN"),
    dpPercent: dpPercentRaw ? Number(dpPercentRaw) : undefined,
    deadlinePelunasan: (formData.get("deadlinePelunasan") as string) || undefined,
    vendorId: (formData.get("vendorId") as string) || undefined,
    variants: parseVariants(formData),
  };
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  let campaign: { id: string };
  try {
    campaign = await api.post<{ id: string }>("/kampanye", campaignBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/kampanye");
  redirect(`/kampanye/${campaign.id}`);
}

export async function updateCampaign(
  campaignId: string,
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  try {
    await api.patch(`/kampanye/${campaignId}`, campaignBody(formData));
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/kampanye/${campaignId}`);
  redirect(`/kampanye/${campaignId}`);
}

export async function toggleFormAktif(campaignId: string, aktif: boolean) {
  await api.post(`/kampanye/${campaignId}/form`, { aktif });
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function addTimelineEntry(campaignId: string, formData: FormData) {
  await api.post(`/kampanye/${campaignId}/timeline`, {
    judulUpdate: String(formData.get("judulUpdate") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  });
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function changeCampaignStatus(
  campaignId: string,
  formData: FormData,
) {
  await api.post(`/kampanye/${campaignId}/status`, {
    status: String(formData.get("status") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  });
  revalidatePath(`/kampanye/${campaignId}`);
}
