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

export type SubmitReviewState = { error?: string; success?: boolean } | undefined;

// v2.3.9 FR-42.23: ulasan Buyer pasca-pesanan — masuk sebagai testimoni
// status DRAFT, baru tampil publik setelah ditinjau Admin/Seller.
export async function submitReview(orderId: string, _prev: SubmitReviewState, formData: FormData): Promise<SubmitReviewState> {
  const rating = Number(formData.get("rating"));
  const quote = String(formData.get("quote") ?? "").trim();
  const tampilkanNama = formData.get("tampilkanNama") === "on";
  if (!rating || rating < 1 || rating > 5) return { error: "Pilih rating bintang 1–5." };
  if (quote.length < 5) return { error: "Ulasan minimal 5 karakter." };
  try {
    await api.post(`/buyer/orders/${orderId}/review`, { rating, quote, tampilkanNama });
    revalidatePath(`/account/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal mengirim ulasan." };
  }
}
