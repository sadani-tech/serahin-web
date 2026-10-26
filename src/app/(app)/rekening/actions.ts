"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function resultUrl(error?: unknown) {
  if (!error) return "/rekening?success=Rekening berhasil disimpan";
  const message = error instanceof ApiError ? error.message : "Rekening belum dapat disimpan";
  return `/rekening?error=${encodeURIComponent(message)}`;
}

export async function saveBankAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const body = {
    accountType: String(formData.get("accountType") ?? "BANK"),
    bankName: String(formData.get("bankName") ?? ""),
    accountNumber: String(formData.get("accountNumber") ?? ""),
    accountHolderName: String(formData.get("accountHolderName") ?? ""),
    isPrimary: formData.get("isPrimary") === "1",
    // isActive hanya relevan untuk rekening yang sudah ada (form tambah
    // rekening baru selalu aktif secara default) — v2.3.7 FR-37.35/37.36.
    ...(id ? { isActive: formData.get("isActive") === "1" } : {}),
  };
  let error: unknown;
  try {
    if (id) await api.patch(`/seller/bank-accounts/${id}`, body);
    else await api.post("/seller/bank-accounts", body);
    revalidatePath("/rekening");
  } catch (reason) {
    error = reason;
  }
  redirect(resultUrl(error));
}

export async function deleteBankAccount(id: string) {
  let error: unknown;
  try {
    await api.del(`/seller/bank-accounts/${id}`);
    revalidatePath("/rekening");
  } catch (reason) {
    error = reason;
  }
  redirect(error
    ? `/rekening?error=${encodeURIComponent(error instanceof ApiError ? error.message : "Rekening belum dapat dihapus")}`
    : "/rekening?success=Rekening berhasil dihapus");
}
