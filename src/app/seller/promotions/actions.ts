"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export type PromotionState = { error?: string; success?: string } | undefined;

export async function saveSellerPromotion(_previous: PromotionState, form: FormData): Promise<PromotionState> {
  const id = String(form.get("id") ?? "").trim();
  const payload = {
    name: String(form.get("name") ?? "").trim(),
    promoMinQuantity: Number(form.get("promoMinQuantity")),
    promoDiscountPerUnit: Number(form.get("promoDiscountPerUnit")),
    isActive: form.get("isActive") === "on",
    salesEventIds: form.getAll("salesEventIds").map(String),
  };
  try {
    if (id) await api.patch(`/seller/promotions/${id}`, payload);
    else await api.post("/seller/promotions", payload);
    revalidatePath("/seller/promotions");
    revalidatePath("/catalog");
    return { success: id ? "Promo diperbarui." : "Promo dibuat." };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Promo gagal disimpan." };
  }
}

export async function deleteSellerPromotion(form: FormData) {
  const id = String(form.get("id") ?? "");
  await api.del(`/seller/promotions/${id}`);
  revalidatePath("/seller/promotions");
  revalidatePath("/catalog");
}
