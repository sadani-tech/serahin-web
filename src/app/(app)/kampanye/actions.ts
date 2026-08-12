"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export type CampaignFormState = { error?: string } | undefined;

function getFormDataValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return value === null ? undefined : (value as string);
}

function getFormDataNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const variants: Array<{ id?: string; namaVarian: string; kuotaMaks: number; harga: number; gambarUrl?: string }> = [];
  const variantIds = formData.getAll("variantId");
  const variantNamavars = formData.getAll("variantNama");
  const variantKuotas = formData.getAll("variantKuota");
  const variantHargas = formData.getAll("variantHarga");
  
  for (let i = 0; i < variantNamavars.length; i++) {
    const namaVarian = variantNamavars[i];
    if (!namaVarian) continue;
    
    variants.push({
      id: variantIds[i] ? String(variantIds[i]) : undefined,
      namaVarian: String(namaVarian),
      kuotaMaks: Number(variantKuotas[i]) || 0,
      harga: Number(variantHargas[i]) || 0,
      gambarUrl: formData.getAll("variantGambar")[i] ? String(formData.getAll("variantGambar")[i]) : undefined,
    });
  }

  try {
    await api.post("/kampanye", {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      tanggalBuka: getFormDataValue(formData, "tanggalBuka") ?? "",
      tanggalTutup: getFormDataValue(formData, "tanggalTutup") ?? "",
      paymentScheme: getFormDataValue(formData, "paymentScheme") as "DP_PELUNASAN" | "LUNAS",
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      deadlinePelunasan: getFormDataValue(formData, "deadlinePelunasan"),
      vendorId: getFormDataValue(formData, "vendorId") || null,
      variants,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal membuat kampanye" };
  }

  revalidatePath("/kampanye");
  redirect("/kampanye");
}

export async function updateCampaign(
  id: string,
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const variants: Array<{ id?: string; namaVarian: string; kuotaMaks: number; harga: number; gambarUrl?: string }> = [];
  const variantIds = formData.getAll("variantId");
  const variantNamavars = formData.getAll("variantNama");
  const variantKuotas = formData.getAll("variantKuota");
  const variantHargas = formData.getAll("variantHarga");
  
  for (let i = 0; i < variantNamavars.length; i++) {
    const namaVarian = variantNamavars[i];
    if (!namaVarian) continue;
    
    variants.push({
      id: variantIds[i] ? String(variantIds[i]) : undefined,
      namaVarian: String(namaVarian),
      kuotaMaks: Number(variantKuotas[i]) || 0,
      harga: Number(variantHargas[i]) || 0,
      gambarUrl: formData.getAll("variantGambar")[i] ? String(formData.getAll("variantGambar")[i]) : undefined,
    });
  }

  try {
    await api.patch(`/kampanye/${id}`, {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      tanggalBuka: getFormDataValue(formData, "tanggalBuka") ?? "",
      tanggalTutup: getFormDataValue(formData, "tanggalTutup") ?? "",
      paymentScheme: getFormDataValue(formData, "paymentScheme") as "DP_PELUNASAN" | "LUNAS",
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      deadlinePelunasan: getFormDataValue(formData, "deadlinePelunasan"),
      vendorId: getFormDataValue(formData, "vendorId") || null,
      variants,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }

  revalidatePath(`/kampanye/${id}`);
  redirect(`/kampanye/${id}`);
}

export async function changeCampaignStatus(campaignId: string, formData: FormData) {
  const status = String(formData.get("status") ?? "");
  const catatan = String(formData.get("catatan") ?? "");
  
  try {
    await api.post(`/kampanye/${campaignId}/status`, { status, catatan });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengubah status" };
  }
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function toggleFormAktif(campaignId: string, aktif: boolean) {
  try {
    await api.post(`/kampanye/${campaignId}/form`, { aktif });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengubah status form" };
  }
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function addTimelineEntry(campaignId: string, formData: FormData) {
  const judulUpdate = String(formData.get("judulUpdate") ?? "");
  const catatan = String(formData.get("catatan") ?? "");

  if (!judulUpdate.trim()) {
    return { error: "Judul update wajib diisi" };
  }

  try {
    await api.post(`/kampanye/${campaignId}/timeline`, {
      judulUpdate,
      catatan,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menambahkan update" };
  }
  revalidatePath(`/kampanye/${campaignId}`);
}

export async function deleteCampaign(id: string) {
  await api.deleteCampaign(id);
  revalidatePath("/kampanye");
}
