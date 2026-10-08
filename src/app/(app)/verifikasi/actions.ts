"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export async function reviewOrders(
  ids: string[],
  keputusan: "APPROVE" | "REJECT",
  alasan?: string,
): Promise<{ updated?: number; error?: string }> {
  if (ids.length === 0) return { updated: 0 };
  if (keputusan === "REJECT" && !alasan?.trim()) {
    return { error: "Alasan penolakan wajib diisi." };
  }
  try {
    const result = await api.post<{ updated: number }>(
      "/pesanan-verifikasi/review",
      { ids, keputusan, alasan: alasan?.trim() },
    );
    revalidatePath("/verifikasi");
    revalidatePath("/");
    return result;
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : "Gagal memproses pesanan.",
    };
  }
}

// v2.3.9 FR-42.2: keputusan Seller/Admin atas pengajuan pembatalan Buyer.
export async function decideCancellation(
  orderId: string,
  keputusan: "APPROVE" | "REJECT",
  alasan?: string,
): Promise<{ ok?: boolean; error?: string }> {
  if (keputusan === "REJECT" && !alasan?.trim()) {
    return { error: "Alasan penolakan wajib diisi." };
  }
  try {
    await api.post(`/pesanan/${orderId}/cancellation/decision`, { keputusan, alasan: alasan?.trim() });
    revalidatePath("/verifikasi");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal memproses keputusan pembatalan." };
  }
}

// v2.3.9 FR-42.2: Seller menandai refund manual sudah selesai dilakukan.
export async function completeRefund(orderId: string, catatan?: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    await api.post(`/pesanan/${orderId}/cancellation/refund`, { catatan: catatan?.trim() || undefined });
    revalidatePath("/verifikasi");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal mencatat refund." };
  }
}

export async function reviewPayments(
  ids: string[],
  keputusan: "TERVERIFIKASI" | "DITOLAK",
  alasan?: string,
): Promise<{ updated?: number; error?: string }> {
  if (!ids.length) return { updated: 0 };
  if (keputusan === "DITOLAK" && !alasan?.trim()) return { error: "Alasan penolakan wajib diisi." };
  try {
    const result = await api.post<{ updated: number }>("/payments/bulk-verify", {
      ids,
      keputusan,
      alasan: alasan?.trim(),
    });
    revalidatePath("/verifikasi");
    revalidatePath("/dashboard");
    revalidatePath("/seller/dashboard");
    return result;
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal memproses pembayaran." };
  }
}
