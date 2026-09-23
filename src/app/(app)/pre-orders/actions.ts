"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { withWibOffset } from "@/lib/format";

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
  const campaignId = formData.get("campaignId");
  const fd = new FormData();
  fd.set("file", file);
  if (typeof campaignId === "string" && campaignId) fd.set("campaignId", campaignId);
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

export type MediaLibraryItem = { id: string; url: string; fileName: string | null; createdAt: string };

/** Pustaka gambar Seller pemilik Batch PO ini, untuk dipilih ulang tanpa unggah ulang. */
export async function listMediaLibrary(
  campaignId: string,
  page = 1,
): Promise<{ data: MediaLibraryItem[]; error?: string }> {
  try {
    const res = await api.get<{ data: MediaLibraryItem[] }>(
      `/pre-orders/${campaignId}/media-library`,
      { page, limit: 60 },
    );
    return { data: res.data };
  } catch (e) {
    return { data: [], error: e instanceof ApiError ? e.message : "Gagal memuat pustaka gambar." };
  }
}

function getFormDataValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return value === null ? undefined : (value as string);
}

function getFormDataNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const value = formData.get(key);
  if (value === null || String(value).trim() === "") return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

export async function createPreorder(
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  try {
    const created = await api.post<{ id: string }>("/pre-orders", {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      productSlug: getFormDataValue(formData, "productSlug"),
      seoTitle: getFormDataValue(formData, "seoTitle"),
      seoDescription: getFormDataValue(formData, "seoDescription"),
      deskripsiPelunasan: getFormDataValue(formData, "deskripsiPelunasan"),
      linkCheckoutShopee: getFormDataValue(formData, "linkCheckoutShopee"),
      nominalCheckoutShopee: getFormDataNumber(formData, "nominalCheckoutShopee"),
      tanggalBuka: withWibOffset(getFormDataValue(formData, "tanggalBuka")) ?? "",
      tanggalTutup: withWibOffset(getFormDataValue(formData, "tanggalTutup")) ?? "",
      estimasiProduksi: withWibOffset(getFormDataValue(formData, "estimasiProduksi")),
      estimasiKirim: withWibOffset(getFormDataValue(formData, "estimasiKirim")),
      paymentScheme: getFormDataValue(formData, "paymentScheme") as
        "DP_PELUNASAN" | "LUNAS",
      dpTipe: getFormDataValue(formData, "dpTipe") as
        "PERSEN" | "NOMINAL" | undefined,
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      dpNominal: getFormDataNumber(formData, "dpNominal"),
      deadlinePelunasan: withWibOffset(getFormDataValue(formData, "deadlinePelunasan")),
      vendorIds: formData.getAll("vendorIds").map(String),
    });
    revalidatePath("/pre-orders");
    redirect(`/pre-orders/${created.id}?tab=produk&created=1`);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal membuat Batch PO",
    };
  }
}

export async function updatePreorder(
  id: string,
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  try {
    await api.patch(`/pre-orders/${id}`, {
      namaProduk: getFormDataValue(formData, "namaProduk") ?? "",
      deskripsi: getFormDataValue(formData, "deskripsi"),
      productSlug: getFormDataValue(formData, "productSlug"),
      seoTitle: getFormDataValue(formData, "seoTitle"),
      seoDescription: getFormDataValue(formData, "seoDescription"),
      deskripsiPelunasan: getFormDataValue(formData, "deskripsiPelunasan"),
      linkCheckoutShopee: getFormDataValue(formData, "linkCheckoutShopee"),
      nominalCheckoutShopee: getFormDataNumber(formData, "nominalCheckoutShopee"),
      tanggalBuka: withWibOffset(getFormDataValue(formData, "tanggalBuka")) ?? "",
      tanggalTutup: withWibOffset(getFormDataValue(formData, "tanggalTutup")) ?? "",
      estimasiProduksi: withWibOffset(getFormDataValue(formData, "estimasiProduksi")),
      estimasiKirim: withWibOffset(getFormDataValue(formData, "estimasiKirim")),
      paymentScheme: getFormDataValue(formData, "paymentScheme") as
        "DP_PELUNASAN" | "LUNAS",
      dpTipe: getFormDataValue(formData, "dpTipe") as
        "PERSEN" | "NOMINAL" | undefined,
      dpPercent: getFormDataNumber(formData, "dpPercent"),
      dpNominal: getFormDataNumber(formData, "dpNominal"),
      deadlinePelunasan: withWibOffset(getFormDataValue(formData, "deadlinePelunasan")),
      vendorIds: formData.getAll("vendorIds").map(String),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }

  revalidatePath(`/pre-orders/${id}`);
  redirect(`/pre-orders/${id}`);
}

function productPayload(formData: FormData) {
  const array = (name: string) => {
    try {
      const value = JSON.parse(String(formData.get(name) ?? "[]"));
      return Array.isArray(value)
        ? value
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
    } catch {
      return [];
    }
  };
  return {
    namaVarian: String(formData.get("namaVarian") ?? "").trim(),
    harga: Number(formData.get("harga") ?? 0),
    hpp: getFormDataNumber(formData, "hpp"),
    kuotaMaks: Number(formData.get("kuotaMaks") ?? 0),
    vendorId: String(formData.get("vendorId") ?? "").trim() || undefined,
    kategori: String(formData.get("kategori") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    ukuran: String(formData.get("ukuran") ?? "").trim(),
    material: String(formData.get("material") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
    deskripsi: String(formData.get("deskripsi") ?? "").trim(),
    images: array("imagesJson"),
    warna: array("warnaJson"),
  };
}

export async function createPreorderProduct(
  campaignId: string,
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  try {
    await api.post(
      `/pre-orders/${campaignId}/products`,
      productPayload(formData),
    );
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menambahkan Produk",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
  redirect(`/pre-orders/${campaignId}?tab=produk`);
}

export async function updatePreorderProduct(
  campaignId: string,
  productId: string,
  _prev: PreorderFormState,
  formData: FormData,
): Promise<PreorderFormState> {
  try {
    await api.patch(
      `/pre-orders/${campaignId}/products/${productId}`,
      productPayload(formData),
    );
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menyimpan Produk",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
  redirect(`/pre-orders/${campaignId}?tab=produk`);
}

export async function deletePreorderProduct(
  campaignId: string,
  productId: string,
) {
  try {
    const result = await api.del<{ action: "deleted" | "deactivated" }>(
      `/pre-orders/${campaignId}/products/${productId}`,
    );
    revalidatePath(`/pre-orders/${campaignId}`);
    return result;
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menghapus Produk",
    };
  }
}

export async function duplicatePreorder(
  id: string,
  _prev: PreorderFormState,
): Promise<PreorderFormState> {
  void _prev;
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

export async function changePreorderStatus(
  campaignId: string,
  formData: FormData,
) {
  const status = String(formData.get("status") ?? "");
  const catatan = String(formData.get("catatan") ?? "");

  try {
    await api.post(`/pre-orders/${campaignId}/status`, { status, catatan });
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal mengubah status",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function toggleFormAktif(campaignId: string, aktif: boolean) {
  try {
    await api.post(`/pre-orders/${campaignId}/form`, { aktif });
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal mengubah status form",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function addTimelineEntry(campaignId: string, formData: FormData) {
  const judulUpdate = String(formData.get("judulUpdate") ?? "");
  const catatan = String(formData.get("catatan") ?? "");
  const milestoneCode =
    String(formData.get("milestoneCode") ?? "") || undefined;
  const isBuyerVisible = formData.get("isBuyerVisible") === "on";

  if (!judulUpdate.trim()) {
    return { error: "Judul update wajib diisi" };
  }

  try {
    await api.post(`/pre-orders/${campaignId}/timeline`, {
      judulUpdate,
      catatan,
      milestoneCode,
      isBuyerVisible,
    });
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menambahkan update",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function deleteTimelineEntry(campaignId: string, entryId: string) {
  try {
    await api.del(`/pre-orders/${campaignId}/timeline/${entryId}`);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menghapus timeline",
    };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
}

export async function deletePreorder(id: string) {
  await api.deletePreorder(id);
  revalidatePath("/pre-orders");
}
