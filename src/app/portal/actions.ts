"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export type PortalPaymentState =
  | { error?: string; ok?: boolean }
  | undefined;

/**
 * Pembeli mengirim pelunasan/pembayaran dari portal (token-gated, endpoint
 * publik). Mengunggah bukti + nominal ke backend. Portal di-revalidate agar
 * ringkasan pembayaran & status "menunggu verifikasi" langsung terbarui.
 */
export async function submitPortalPayment(
  token: string,
  _prev: PortalPaymentState,
  formData: FormData,
): Promise<PortalPaymentState> {
  const jumlahRaw = String(formData.get("jumlahBayar") ?? "").replace(/\D/g, "");
  const jumlah = jumlahRaw ? Number(jumlahRaw) : 0;
  if (jumlah <= 0) return { error: "Jumlah pembayaran wajib diisi." };

  const bukti = formData.get("bukti");
  if (!(bukti instanceof File) || bukti.size === 0) {
    return { error: "Bukti pembayaran wajib diunggah." };
  }

  const fd = new FormData();
  fd.set("jumlahBayar", String(jumlah));
  fd.set("bukti", bukti);

  // Metode pengiriman (v1.8) — hanya dikirim pada tahap pelunasan. Backend
  // memvalidasi kewajiban metode/alamat sesuai tahap & pilihan.
  const metode = String(formData.get("metodePengiriman") ?? "").trim();
  if (metode === "SHOPEE" || metode === "EKSPEDISI") {
    fd.set("metodePengiriman", metode);
    const alamat = String(formData.get("alamatPengiriman") ?? "").trim();
    if (metode === "EKSPEDISI") {
      if (!alamat) {
        return {
          error:
            "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi.",
        };
      }
      fd.set("alamatPengiriman", alamat);
    }
  }

  try {
    await api.postForm(`/public/order/${token}/payment`, fd);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal mengirim pembayaran.",
    };
  }

  revalidatePath(`/portal/${token}`);
  return { ok: true };
}
