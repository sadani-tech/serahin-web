// Tipe enum domain (mirror Prisma) — frontend tidak lagi meng-generate Prisma;
// backend NestJS adalah pemilik skema. Nilai harus sinkron dengan prisma/schema.

export type UserRole = "ADMIN";

export type CampaignStatus =
  | "OPEN"
  | "CLOSED"
  | "PRODUKSI"
  | "SIAP_KIRIM"
  | "SELESAI";

export type PaymentScheme = "DP_PELUNASAN" | "LUNAS";
export type DpTipe = "PERSEN" | "NOMINAL";

export type OrderStatus =
  | "BARU_MASUK"
  | "MENUNGGU_DP"
  | "DP_DITERIMA"
  | "LUNAS"
  | "PRODUKSI"
  | "SIAP_KIRIM"
  | "DIKIRIM"
  | "SELESAI"
  | "DIBATALKAN"
  | "DITOLAK";

export type PaymentType = "DP" | "PELUNASAN" | "LUNAS";

export type MetodePengiriman = "SHOPEE" | "EKSPEDISI";

export type PaymentVerification =
  | "MENUNGGU_VERIFIKASI"
  | "TERVERIFIKASI"
  | "DITOLAK"
  | "KEDALUWARSA";

// v2.1 — kanal pembayaran (transfer manual vs payment gateway).
export type PaymentChannel = "MANUAL_TRANSFER" | "GATEWAY";

export type SumberPesanan = "MANUAL" | "FORM_PUBLIK" | "IMPORT";

export type SumberKampanye = "MANUAL" | "IMPORT";

export type ImportMode = "KAMPANYE_PENUH" | "PESANAN" | "LEGACY";

export type ImportStatus = "BERHASIL" | "DIROLLBACK";

export type PageStatus = "DRAFT" | "PUBLISH";

export type KetepatanWaktu = "TEPAT_WAKTU" | "TELAT";

export type KesesuaianKualitas = "SESUAI" | "TIDAK_SESUAI";

/** Pengguna terautentikasi (dari JWT). */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
