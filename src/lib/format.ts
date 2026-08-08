type DecimalInput = number | string | { toString(): string } | null | undefined;

/** Ubah nilai Decimal/number/string menjadi number aman. */
export function toNumber(value: DecimalInput): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

/** Format Rupiah, mis. 150000 -> "Rp150.000". */
export function formatRupiah(value: DecimalInput): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

/** Format tanggal panjang, mis. "25 Juli 2026". */
export function formatTanggal(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Format tanggal + waktu, mis. "25 Jul 2026, 14:30". */
export function formatWaktu(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Ubah Date ke string "YYYY-MM-DD" untuk input[type=date]. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
