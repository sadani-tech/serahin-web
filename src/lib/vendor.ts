import { KetepatanWaktu, KesesuaianKualitas } from "@/generated/prisma";

export const KETEPATAN_LABEL: Record<KetepatanWaktu, string> = {
  TEPAT_WAKTU: "Tepat waktu",
  TELAT: "Telat",
};

export const KUALITAS_LABEL: Record<KesesuaianKualitas, string> = {
  SESUAI: "Sesuai sampel",
  TIDAK_SESUAI: "Tidak sesuai",
};

export type EvalInput = {
  rating: number;
  ketepatanWaktu: KetepatanWaktu;
  jumlahHariTelat: number | null;
};

export type VendorStats = {
  jumlahEvaluasi: number;
  avgRating: number | null;
  jumlahTelat: number;
  totalHariTelat: number;
};

/** Ringkasan performa vendor dari daftar evaluasi (FR-7.4 / FR-7.5). */
export function computeVendorStats(evaluations: EvalInput[]): VendorStats {
  const jumlahEvaluasi = evaluations.length;
  if (jumlahEvaluasi === 0) {
    return { jumlahEvaluasi: 0, avgRating: null, jumlahTelat: 0, totalHariTelat: 0 };
  }
  const totalRating = evaluations.reduce((s, e) => s + e.rating, 0);
  const jumlahTelat = evaluations.filter(
    (e) => e.ketepatanWaktu === "TELAT",
  ).length;
  const totalHariTelat = evaluations.reduce(
    (s, e) => s + (e.jumlahHariTelat ?? 0),
    0,
  );
  return {
    jumlahEvaluasi,
    avgRating: Math.round((totalRating / jumlahEvaluasi) * 10) / 10,
    jumlahTelat,
    totalHariTelat,
  };
}

/** Bintang teks sederhana untuk rating rata-rata. */
export function ratingStars(avg: number | null): string {
  if (avg === null) return "Belum ada rating";
  const full = Math.round(avg);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full)) + ` ${avg}`;
}
