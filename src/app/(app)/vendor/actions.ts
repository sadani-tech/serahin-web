"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";

export type VendorPaymentFormState = { error?: string } | undefined;

/**
 * Catat pembayaran ke Vendor (PRD v2.3.8 §3.1/§5.2). FormData diteruskan apa
 * adanya ke backend (multipart) — field "bukti" (file, opsional) ditangani
 * oleh `FileInterceptor("bukti")` di KeuanganController.
 */
export async function createVendorPayment(
  vendorId: string,
  _prev: VendorPaymentFormState,
  formData: FormData,
): Promise<VendorPaymentFormState> {
  try {
    await api.postForm(`/keuangan/vendor/${vendorId}/payments`, formData);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan pembayaran" };
  }
  revalidatePath(`/vendor/${vendorId}`);
  return undefined;
}

const vendorSchema = z.object({
  nama: z.string().min(1, "Nama vendor wajib diisi"),
  kontak: z.string().optional(),
  spesialisasi: z.string().optional(),
  catatanUmum: z.string().optional(),
  pricelist: z.string().optional(),
});

export type VendorFormState = { error?: string } | undefined;

function parseVendor(formData: FormData) {
  return vendorSchema.safeParse({
    nama: formData.get("nama"),
    kontak: formData.get("kontak") || undefined,
    spesialisasi: formData.get("spesialisasi") || undefined,
    catatanUmum: formData.get("catatanUmum") || undefined,
    pricelist: formData.get("pricelist") || undefined,
  });
}

export async function createVendor(
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const parsed = parseVendor(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  let vendor: { id: string };
  try {
    vendor = await api.post<{ id: string }>("/vendor", parsed.data);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath("/vendor");
  redirect(`/vendor/${vendor.id}`);
}

export async function updateVendor(
  vendorId: string,
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const parsed = parseVendor(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  try {
    await api.patch(`/vendor/${vendorId}`, parsed.data);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/vendor/${vendorId}`);
  redirect(`/vendor/${vendorId}`);
}

export async function deleteVendor(
  vendorId: string,
): Promise<{ error?: string }> {
  try {
    await api.del(`/vendor/${vendorId}`);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal menghapus vendor",
    };
  }
  revalidatePath("/vendor");
  return {};
}

const evalSchema = z.object({
  ketepatanWaktu: z.enum(["TEPAT_WAKTU", "TELAT"]),
  jumlahHariTelat: z.coerce.number().int().min(0).optional(),
  kesesuaianKualitas: z.enum(["SESUAI", "TIDAK_SESUAI"]),
  rating: z.coerce.number().int().min(1).max(5),
  catatan: z.string().optional(),
});

export async function saveEvaluation(
  campaignId: string,
  vendorId: string,
  _prev: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const parsed = evalSchema.safeParse({
    ketepatanWaktu: formData.get("ketepatanWaktu"),
    jumlahHariTelat: formData.get("jumlahHariTelat") || undefined,
    kesesuaianKualitas: formData.get("kesesuaianKualitas"),
    rating: formData.get("rating"),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  try {
    await api.post("/vendor/evaluations", { campaignId, vendorId, ...parsed.data });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
  return undefined;
}
