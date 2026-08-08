import {
  ImportMode,
  ImportStatus,
  OrderStatus,
  PaymentType,
} from "@/generated/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/domain";

export const IMPORT_MODE_LABEL: Record<ImportMode, string> = {
  KAMPANYE_PENUH: "Kampanye Penuh (Mode A)",
  PESANAN: "Pesanan ke Kampanye (Mode B)",
  LEGACY: "Format Lawas",
};

export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  BERHASIL: "Berhasil",
  DIROLLBACK: "Dirollback",
};

/** Normalisasi nama varian: lowercase + rapatkan spasi (v1.3 Mode B & v1.4). */
export function normalizeVarian(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// Peta label/enum → OrderStatus (case-insensitive).
const orderStatusLookup: Record<string, OrderStatus> = (() => {
  const map: Record<string, OrderStatus> = {};
  for (const [enumVal, label] of Object.entries(ORDER_STATUS_LABEL)) {
    map[enumVal.toLowerCase()] = enumVal as OrderStatus;
    map[label.toLowerCase()] = enumVal as OrderStatus;
  }
  return map;
})();

/** Ubah teks status pesanan bebas → OrderStatus, null bila tidak dikenali. */
export function parseOrderStatus(value: string): OrderStatus | null {
  if (!value) return null;
  return orderStatusLookup[value.trim().toLowerCase()] ?? null;
}

/** Ubah teks jenis pembayaran → PaymentType, null bila tidak dikenali. */
export function parsePaymentType(value: string): PaymentType | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (v === "dp") return "DP";
  if (v === "pelunasan") return "PELUNASAN";
  if (v === "lunas" || v === "bayar lunas") return "LUNAS";
  return null;
}
