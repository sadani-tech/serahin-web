"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api, ApiError, TOKEN_COOKIE } from "@/lib/api";

export async function updateSellerProfile(formData: FormData) {
  await api.patch("/seller/profile", { businessName: String(formData.get("businessName") ?? ""), description: String(formData.get("description") ?? ""), contactEmail: String(formData.get("contactEmail") ?? ""), logoUrl: String(formData.get("logoUrl") ?? "") || undefined });
  revalidatePath("/seller/profile"); revalidatePath("/seller/dashboard");
}

export async function requestPhoneChange(_previous: { error?: string; success?: string } | undefined, formData: FormData) {
  try {
    await api.post("/seller/profile/phone-change-requests", { newPhone: String(formData.get("newPhone") ?? ""), reason: String(formData.get("reason") ?? "") });
    revalidatePath("/seller/profile");
    return { success: "Permintaan terkirim. Owner akan meninjau nomor baru Anda." };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Permintaan gagal dikirim." };
  }
}

export type UploadSellerLogoState = { error?: string; success?: string } | undefined;

export async function uploadSellerLogoAction(_prev: UploadSellerLogoState, form: FormData): Promise<UploadSellerLogoState> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file gambar terlebih dahulu." };
  const fd = new FormData();
  fd.set("file", file);
  try {
    await api.postForm("/seller/profile/avatar", fd);
    revalidatePath("/seller/profile"); revalidatePath("/seller/dashboard");
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Logo gagal diunggah." };
  }
  return { success: "Logo berhasil diperbarui." };
}

export type ChangeSellerPasswordState = { error?: string; success?: string } | undefined;

export async function changePasswordSellerAction(
  _prev: ChangeSellerPasswordState,
  formData: FormData,
): Promise<ChangeSellerPasswordState> {
  try {
    const result = await api.post<{ accessToken: string; maxAgeSeconds?: number }>("/auth/seller/change-password", {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    (await cookies()).set(TOKEN_COOKIE, result.accessToken, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: result.maxAgeSeconds ?? 86400,
    });
    return { success: "Kata sandi berhasil diperbarui dan sesi lain telah dicabut." };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Kata sandi gagal diperbarui." };
  }
}
