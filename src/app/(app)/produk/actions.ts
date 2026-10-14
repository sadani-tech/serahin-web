"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";

export type ProdukFormState = { error?: string } | undefined;

const produkSchema = z.object({
  nama: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().optional(),
  kategori: z.string().optional(),
  ukuran: z.string().optional(),
  material: z.string().optional(),
  deskripsi: z.string().optional(),
});

function parseJsonArray(formData: FormData, name: string): string[] {
  try {
    const value = JSON.parse(String(formData.get(name) ?? "[]"));
    return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseProduk(formData: FormData) {
  const parsed = produkSchema.safeParse({
    nama: formData.get("nama"),
    sku: formData.get("sku") || undefined,
    kategori: formData.get("kategori") || undefined,
    ukuran: formData.get("ukuran") || undefined,
    material: formData.get("material") || undefined,
    deskripsi: formData.get("deskripsi") || undefined,
  });
  if (!parsed.success) return parsed;
  return {
    ...parsed,
    data: {
      ...parsed.data,
      images: parseJsonArray(formData, "imagesJson"),
      warna: parseJsonArray(formData, "warnaJson"),
    },
  };
}

export async function createProduk(
  _prev: ProdukFormState,
  formData: FormData,
): Promise<ProdukFormState> {
  const parsed = parseProduk(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  try {
    await api.post<{ id: string }>("/produk", parsed.data);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/produk");
  redirect("/produk");
}

export async function updateProduk(
  produkId: string,
  _prev: ProdukFormState,
  formData: FormData,
): Promise<ProdukFormState> {
  const parsed = parseProduk(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  try {
    await api.patch(`/produk/${produkId}`, parsed.data);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/produk/${produkId}`);
  revalidatePath("/produk");
  redirect("/produk");
}

export async function toggleProdukActive(produkId: string, isActive: boolean) {
  try {
    await api.patch(`/produk/${produkId}`, { isActive });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengubah status" };
  }
  revalidatePath(`/produk/${produkId}`);
  revalidatePath("/produk");
  return {};
}

export async function deleteProduk(produkId: string): Promise<{ error?: string }> {
  try {
    await api.del(`/produk/${produkId}`);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menghapus produk" };
  }
  revalidatePath("/produk");
  return {};
}
