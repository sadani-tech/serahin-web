"use server";

import { redirect } from "next/navigation";
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

export type SettlementPreview = {
  dueTotal: number;
  shopeeMaxAmount: number;
  bankAmountIfShopee: number;
  error?: string;
};

/**
 * Pratinjau nominal pelunasan untuk item yang dicheck Buyer (pelunasan per
 * produk, v2.3.7) — dipanggil setiap checklist berubah. Nominal selalu
 * dihitung di server, frontend tidak pernah menghitung uang sendiri.
 */
export async function getSettlementPreview(
  token: string,
  itemIds: string[],
): Promise<SettlementPreview> {
  try {
    return await api.post<SettlementPreview>(
      `/public/order/${token}/settlement-preview`,
      { itemIds },
    );
  } catch (e) {
    return {
      dueTotal: 0,
      shopeeMaxAmount: 0,
      bankAmountIfShopee: 0,
      error: e instanceof ApiError ? e.message : "Gagal memuat pratinjau pelunasan.",
    };
  }
}

/**
 * Pengajuan pelunasan per produk (v2.3.7) — hanya untuk item yang dicheck
 * Buyer, bisa split transfer bank + checkout Shopee sekaligus. Menggantikan
 * submitPortalPayment khusus untuk tahap pelunasan bertarget-item.
 */
export async function submitPortalSettlement(
  token: string,
  _prev: PortalPaymentState,
  formData: FormData,
): Promise<PortalPaymentState> {
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  if (itemIds.length === 0) return { error: "Pilih minimal satu produk untuk dilunasi." };

  const fd = new FormData();
  fd.set("itemIds", JSON.stringify(itemIds));

  const includeShopee = formData.get("includeShopee") === "1";
  if (includeShopee) {
    const buktiShopee = formData.get("buktiShopee");
    if (!(buktiShopee instanceof File) || buktiShopee.size === 0) {
      return { error: "Bukti checkout Shopee wajib diunggah." };
    }
    fd.set("includeShopee", "1");
    fd.set("buktiShopee", buktiShopee);
  }

  const bukti = formData.get("bukti");
  if (bukti instanceof File && bukti.size > 0) fd.set("bukti", bukti);

  const metode = String(formData.get("metodePengiriman") ?? "").trim();
  if (metode === "SHOPEE" || metode === "EKSPEDISI") {
    fd.set("metodePengiriman", metode);
    const alamat = String(formData.get("alamatPengiriman") ?? "").trim();
    if (metode === "EKSPEDISI") {
      if (!alamat) {
        return { error: "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi." };
      }
      fd.set("alamatPengiriman", alamat);
    }
  }

  try {
    await api.postForm(`/public/order/${token}/settlement`, fd);
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal mengirim pelunasan.",
    };
  }

  revalidatePath(`/portal/${token}`);
  return { ok: true };
}

/**
 * v2.1 — pembeli memulai pembayaran otomatis (gateway) dari portal. Backend
 * membuat charge di payment-service dan mengembalikan paymentUrl; kita arahkan
 * pembeli ke sana. Metode pengiriman (v1.8) tetap wajib pada tahap pelunasan.
 */
export async function startPortalGatewayPayment(
  token: string,
  _prev: PortalPaymentState,
  formData: FormData,
): Promise<PortalPaymentState> {
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  const jumlahRaw = String(formData.get("jumlahBayar") ?? "").replace(/\D/g, "");
  const jumlah = jumlahRaw ? Number(jumlahRaw) : 0;
  if (itemIds.length === 0 && jumlah <= 0) return { error: "Jumlah pembayaran wajib diisi." };

  const body: {
    jumlahBayar?: number;
    itemIds?: string[];
    idempotencyKey: string;
    metodePengiriman?: string;
    alamatPengiriman?: string;
  } = {
    ...(jumlah > 0 ? { jumlahBayar: jumlah } : {}),
    ...(itemIds.length > 0 ? { itemIds } : {}),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  };

  if (!body.idempotencyKey) {
    return { error: "Kunci pembayaran tidak tersedia. Muat ulang halaman." };
  }

  const metode = String(formData.get("metodePengiriman") ?? "").trim();
  if (metode === "SHOPEE" || metode === "EKSPEDISI") {
    body.metodePengiriman = metode;
    const alamat = String(formData.get("alamatPengiriman") ?? "").trim();
    if (metode === "EKSPEDISI") {
      if (!alamat) {
        return {
          error:
            "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi.",
        };
      }
      body.alamatPengiriman = alamat;
    }
  }

  let paymentUrl: string | undefined;
  try {
    const res = await api.post<{ paymentUrl?: string }>(
      `/public/order/${token}/payment/gateway`,
      body,
    );
    paymentUrl = res.paymentUrl;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      redirect(`/api/auth/switch?callbackUrl=${encodeURIComponent(`/portal/${token}?payment=1`)}`);
    }
    return {
      error: e instanceof ApiError ? e.message : "Gagal memulai pembayaran.",
    };
  }

  if (!paymentUrl) return { error: "Gagal memulai pembayaran." };
  redirect(paymentUrl);
}
