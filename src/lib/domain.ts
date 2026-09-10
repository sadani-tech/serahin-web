import {
  CampaignStatus,
  MetodePengiriman,
  OrderStatus,
  PaymentChannel,
  PaymentType,
  PaymentVerification,
  PaymentScheme,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Status Kampanye (FR-1.4): Open → Closed → Produksi → Siap Kirim → Selesai
// ---------------------------------------------------------------------------

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  PRODUKSI: "Produksi",
  SIAP_KIRIM: "Siap Kirim",
  SELESAI: "Selesai",
};

/** Urutan linear status kampanye untuk validasi & tampilan progress. */
export const CAMPAIGN_STATUS_ORDER: CampaignStatus[] = [
  "OPEN",
  "CLOSED",
  "PRODUKSI",
  "SIAP_KIRIM",
  "SELESAI",
];

export const CAMPAIGN_STATUS_BADGE: Record<CampaignStatus, string> = {
  OPEN: "bg-brand-100 text-brand-800 ring-brand-600/25",
  CLOSED: "bg-sun-100 text-sun-800 ring-sun-600/25",
  PRODUKSI: "bg-accent-500 text-sand-900 ring-accent-600/30",
  SIAP_KIRIM: "bg-sun-400 text-sand-900 ring-sun-600/30",
  SELESAI: "bg-brand-800 text-brand-50 ring-brand-900/30",
};

/** Kampanye menolak pesanan baru mulai status CLOSED ke atas (FR-1.6). */
export function campaignMenerimaPesanan(status: CampaignStatus): boolean {
  return status === "OPEN";
}

// ---------------------------------------------------------------------------
// Status Pesanan (FR-2.3)
// ---------------------------------------------------------------------------

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  BARU_MASUK: "Baru Masuk",
  MENUNGGU_DP: "Menunggu DP",
  DP_DITERIMA: "DP Diterima",
  LUNAS: "Lunas",
  PRODUKSI: "Produksi",
  SIAP_KIRIM: "Siap Kirim",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
  DITOLAK: "Ditolak",
};

// Alur status normal setelah verifikasi (BARU_MASUK di luar alur ini).
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "MENUNGGU_DP",
  "DP_DITERIMA",
  "LUNAS",
  "PRODUKSI",
  "SIAP_KIRIM",
  "DIKIRIM",
  "SELESAI",
];

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  BARU_MASUK: "bg-sun-100 text-sun-800 ring-sun-600/25",
  MENUNGGU_DP: "bg-rose-100 text-rose-800 ring-rose-600/25",
  DP_DITERIMA: "bg-accent-100 text-accent-800 ring-accent-600/25",
  LUNAS: "bg-brand-100 text-brand-800 ring-brand-600/25",
  PRODUKSI: "bg-accent-500 text-sand-900 ring-accent-600/30",
  SIAP_KIRIM: "bg-sun-400 text-sand-900 ring-sun-600/30",
  DIKIRIM: "bg-brand-500 text-white ring-brand-700/30",
  SELESAI: "bg-brand-800 text-brand-50 ring-brand-900/30",
  DIBATALKAN: "bg-sand-200 text-sand-600 ring-sand-500/25 line-through",
  DITOLAK: "bg-sand-200 text-sand-600 ring-sand-500/25 line-through",
};

/**
 * Status yang TIDAK menempati kuota (pesanan tidak aktif).
 * BARU_MASUK tetap menempati kuota (reservasi, v1.2 FR-1.4).
 */
export const ORDER_STATUS_NONAKTIF: OrderStatus[] = ["DIBATALKAN", "DITOLAK"];

/** Pesanan dianggap aktif (menempati kuota) selama bukan dibatalkan/ditolak. */
export function orderAktif(status: OrderStatus): boolean {
  return !ORDER_STATUS_NONAKTIF.includes(status);
}

// ---------------------------------------------------------------------------
// Pembayaran (FR-3.x)
// ---------------------------------------------------------------------------

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  DP: "DP",
  PELUNASAN: "Pelunasan",
  LUNAS: "Bayar Lunas",
};

export const PAYMENT_VERIFICATION_LABEL: Record<PaymentVerification, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
  KEDALUWARSA: "Kedaluwarsa",
};

export const PAYMENT_VERIFICATION_BADGE: Record<PaymentVerification, string> = {
  MENUNGGU_VERIFIKASI: "bg-sun-100 text-sun-800 ring-sun-600/25",
  TERVERIFIKASI: "bg-brand-100 text-brand-800 ring-brand-600/25",
  DITOLAK: "bg-rose-100 text-rose-800 ring-rose-600/25",
  KEDALUWARSA: "bg-sand-200 text-sand-600 ring-sand-500/25",
};

// v2.1 — kanal pembayaran.
export const PAYMENT_CHANNEL_LABEL: Record<PaymentChannel, string> = {
  MANUAL_TRANSFER: "Transfer Manual",
  GATEWAY: "Pembayaran Otomatis",
};

export const PAYMENT_SCHEME_LABEL: Record<PaymentScheme, string> = {
  DP_PELUNASAN: "DP + Pelunasan",
  LUNAS: "Lunas Langsung",
};

// ---------------------------------------------------------------------------
// Metode Pengiriman (v1.8) — pilihan pembeli saat pelunasan
// ---------------------------------------------------------------------------

export const METODE_PENGIRIMAN_LABEL: Record<MetodePengiriman, string> = {
  SHOPEE: "Checkout Shopee",
  EKSPEDISI: "Manual by Ekspedisi",
};

export function badge(base: string): string {
  return `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${base}`;
}
