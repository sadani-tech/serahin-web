"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export type PreorderFormState = { error?: string } | undefined;

/**
 * Unggah gambar varian ke backend (multipart) dan kembalikan URL publik.
 * Dipanggil dari client saat mode "Upload" pada form kampanye.
 */
export async function uploadVariantImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File gambar wajib dipilih." };
  }
  const fd = new FormData();
  fd.set("file", file);
  try {
    const res = await api.postForm<{ url: string }>(
      "/pre-orders/upload-gambar",
      fd,
    );
    return { url: res.url };
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal mengunggah gambar.",
    };
  }
}

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

type VariantPayload = {
  id?: string;
  namaVarian: string;
  kuotaMaks: number;
  harga: number;
  images: string[];
  warna: string[];
  kategori: string;
  label?: string;
  ukuran?: string;
  material?: string;
  sku?: string;
  deskripsi?: string;
  vendorId?: string;
};

/** Parse field `variantsJson` (dikirim PreorderForm) menjadi payload varian. */
function parseVariants(formData: FormData): VariantPayload[] {
  const raw = getFormDataValue(formData, "variantsJson");
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: VariantPayload[] = [];
  for (const v of arr as Record<string, unknown>[]) {
    const namaVarian = String(v.namaVarian ?? "").trim();
    if (!namaVarian) continue;
    const images = Array.isArray(v.images)
      ? v.images.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const warna = Array.isArray(v.warna)
      ? v.warna.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const text = (key: string) => String(v[key] ?? "").trim();
    out.push({
      id: v.id ? String(v.id) : undefined,
      namaVarian,
      kuotaMaks: Number(v.kuotaMaks) || 0,
      harga: Number(v.harga) || 0,
      images,
      warna,
      kategori: text("kategori"),
      // Kirim string kosong untuk field yang dibersihkan agar API menyimpannya
      // sebagai null, bukan mempertahankan metadata lama.
      label: text("label"),
      ukuran: text("ukuran"),
      material: text("material"),
      sku: text("sku"),
      deskripsi: text("deskripsi"),
      vendorId: text("vendorId") || undefined,
    });
  }
  return out;
}

export async function createPreorder(
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  const variants = parseVariants(formData);

  try {
    await api.post("/pre-orders", {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      deskripsiPelunasan: getFormDataValue(formData, "deskripsiPelunasan"),
      linkCheckoutShopee: getFormDataValue(formData, "linkCheckoutShopee"),
      tanggalBuka: getFormDataValue(formData, "tanggalBuka") ?? "",
      tanggalTutup: getFormDataValue(formData, "tanggalTutup") ?? "",
      paymentScheme: getFormDataValue(formData, "paymentScheme") as "DP_PELUNASAN" | "LUNAS",
      dpTipe: getFormDataValue(formData, "dpTipe") as "PERSEN" | "NOMINAL" | undefined,
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      dpNominal: getFormDataNumber(formData, "dpNominal"),
      deadlinePelunasan: getFormDataValue(formData, "deadlinePelunasan"),
      vendorIds: formData.getAll("vendorIds").map(String),
      variants,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal membuat Batch PO" };
  }

  revalidatePath("/pre-orders");
  redirect("/pre-orders");
}

export async function updatePreorder(
  id: string,
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  const variants = parseVariants(formData);

  try {
    await api.patch(`/pre-orders/${id}`, {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      deskripsiPelunasan: getFormDataValue(formData, "deskripsiPelunasan"),
      linkCheckoutShopee: getFormDataValue(formData, "linkCheckoutShopee"),
      tanggalBuka: getFormDataValue(formData, "tanggalBuka") ?? "",
      tanggalTutup: getFormDataValue(formData, "tanggalTutup") ?? "",
      paymentScheme: getFormDataValue(formData, "paymentScheme") as "DP_PELUNASAN" | "LUNAS",
      dpTipe: getFormDataValue(formData, "dpTipe") as "PERSEN" | "NOMINAL" | undefined,
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      dpNominal: getFormDataNumber(formData, "dpNominal"),
      deadlinePelunasan: getFormDataValue(formData, "deadlinePelunasan"),
      vendorIds: formData.getAll("vendorIds").map(String),
      variants,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }

  revalidatePath(`/pre-orders/${id}`);
  redirect(`/pre-orders/${id}`);
}

export async function duplicatePreorder(
  id: string,
  _prev: PreorderFormState,
): Promise<PreorderFormState> {
  let duplicated: { id: string };
  try {
    duplicated = await api.post<{ id: string }>(`/pre-orders/${id}/duplicate`);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menduplikasi Batch PO",
    };
  }
  revalidatePath("/pre-orders");
  redirect(`/pre-orders/${duplicated.id}/edit`);
}

export async function changePreorderStatus(campaignId: string, formData: FormData) {
  const status = String(formData.get("status") ?? "");
  const catatan = String(formData.get("catatan") ?? "");
  
  try {
    await api.post(`/pre-orders/${campaignId}/status`, { status, catatan });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengubah status" };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function toggleFormAktif(campaignId: string, aktif: boolean) {
  try {
    await api.post(`/pre-orders/${campaignId}/form`, { aktif });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengubah status form" };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function addTimelineEntry(campaignId: string, formData: FormData) {
  const judulUpdate = String(formData.get("judulUpdate") ?? "");
  const catatan = String(formData.get("catatan") ?? "");

  if (!judulUpdate.trim()) {
    return { error: "Judul update wajib diisi" };
  }

  try {
    await api.post(`/pre-orders/${campaignId}/timeline`, {
      judulUpdate,
      catatan,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menambahkan update" };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function deletePreorder(id: string) {
  await api.deletePreorder(id);
  revalidatePath("/pre-orders");
}
