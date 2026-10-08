"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export type CancelRequestState = { error?: string } | undefined;

// v2.3.9 FR-42.2: Buyer mengajukan pembatalan — tidak langsung membatalkan,
// menunggu keputusan Seller/Admin (lihat tab Verifikasi > Pembatalan).
export async function requestCancellation(orderId: string, _prev: CancelRequestState, formData: FormData): Promise<CancelRequestState> {
  const alasan = String(formData.get("alasan") ?? "").trim();
  if (!alasan) return { error: "Alasan pembatalan wajib diisi." };
  try {
    await api.post(`/buyer/orders/${orderId}/cancel-request`, { alasan });
    revalidatePath(`/account/orders/${orderId}`);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal mengajukan pembatalan." };
  }
}
