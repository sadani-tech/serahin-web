import {
  CampaignStatus,
  MetodePengiriman,
  OrderStatus,
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
  OPEN: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  CLOSED: "bg-amber-100 text-amber-800 ring-amber-600/20",
  PRODUKSI: "bg-blue-100 text-blue-800 ring-blue-600/20",
  SIAP_KIRIM: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  SELESAI: "bg-slate-100 text-slate-700 ring-slate-600/20",
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
  BARU_MASUK: "bg-sky-100 text-sky-800 ring-sky-600/20",
  MENUNGGU_DP: "bg-rose-100 text-rose-800 ring-rose-600/20",
  DP_DITERIMA: "bg-amber-100 text-amber-800 ring-amber-600/20",
  LUNAS: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  PRODUKSI: "bg-blue-100 text-blue-800 ring-blue-600/20",
  SIAP_KIRIM: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  DIKIRIM: "bg-violet-100 text-violet-800 ring-violet-600/20",
  SELESAI: "bg-slate-100 text-slate-700 ring-slate-600/20",
  DIBATALKAN: "bg-slate-200 text-slate-500 ring-slate-600/20 line-through",
  DITOLAK: "bg-slate-200 text-slate-500 ring-slate-600/20 line-through",
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
};

export const PAYMENT_VERIFICATION_BADGE: Record<PaymentVerification, string> = {
  MENUNGGU_VERIFIKASI: "bg-amber-100 text-amber-800 ring-amber-600/20",
  TERVERIFIKASI: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  DITOLAK: "bg-rose-100 text-rose-800 ring-rose-600/20",
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
  return `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${base}`;
}
