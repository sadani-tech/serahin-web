"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api, ApiError, TOKEN_COOKIE } from "@/lib/api";

export async function updateSellerProfile(formData: FormData) {
  await api.patch("/seller/profile", { businessName: String(formData.get("businessName") ?? ""), description: String(formData.get("description") ?? ""), contactEmail: String(formData.get("contactEmail") ?? ""), contactPhone: String(formData.get("contactPhone") ?? ""), logoUrl: String(formData.get("logoUrl") ?? "") || undefined });
  revalidatePath("/seller/profile"); revalidatePath("/seller/dashboard");
}

export type PromotionState = { error?: string; success?: string } | undefined;

export async function updateSellerPromotion(_prev: PromotionState, formData: FormData): Promise<PromotionState> {
  const minimum = String(formData.get("promoMinQuantity") ?? "").trim();
  const discount = String(formData.get("promoDiscountPerUnit") ?? "").trim();
  try {
    await api.patch("/seller/promotion", {
      promoMinQuantity: minimum ? Number(minimum) : null,
      promoDiscountPerUnit: discount ? Number(discount) : null,
    });
    revalidatePath("/seller/profile");
    revalidatePath("/catalog");
    return { success: "Promo toko berhasil disimpan." };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Promo toko gagal disimpan." };
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
