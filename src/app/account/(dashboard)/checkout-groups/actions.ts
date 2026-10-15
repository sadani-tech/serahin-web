"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export type UploadCheckoutGroupPaymentState = { error?: string; success?: string } | undefined;

export async function uploadCheckoutGroupPayment(
  checkoutGroupId: string,
  _prev: UploadCheckoutGroupPaymentState,
  formData: FormData,
): Promise<UploadCheckoutGroupPaymentState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file bukti transfer terlebih dahulu." };
  const fd = new FormData();
  fd.set("file", file);
  try {
    await api.postForm(`/buyer/checkout-groups/${checkoutGroupId}/payment`, fd);
    revalidatePath(`/account/checkout-groups/${checkoutGroupId}`);
    revalidatePath("/account/checkout-groups");
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Bukti transfer gagal diunggah." };
  }
  return { success: "Bukti transfer berhasil dikirim. Menunggu verifikasi Seller." };
}
