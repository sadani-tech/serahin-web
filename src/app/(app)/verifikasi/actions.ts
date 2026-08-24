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
