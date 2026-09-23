type DecimalInput = number | string | { toString(): string } | null | undefined;

/** Timezone operasional Serahin (v2.3.7 FR-37.10) — dipakai di semua tampilan/format jam. */
const WIB_TZ = "Asia/Jakarta";

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

/** Format tanggal panjang, mis. "25 Juli 2026" (dipatok ke WIB). */
export function formatTanggal(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB_TZ,
  }).format(d);
}

/** Format tanggal + waktu presisi WIB, mis. "25 Jul 2026, 14:30 WIB". */
export function formatWaktu(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WIB_TZ,
  }).format(d)} WIB`;
}

/** Ubah Date ke string "YYYY-MM-DD" untuk input[type=date]. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function wibParts(d: Date): { year: string; month: string; day: string; hour: string; minute: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Ubah Date ke string "YYYY-MM-DDTHH:mm" (WIB) untuk input[type=datetime-local] (v2.3.7 FR-37.8). */
export function toDateTimeInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const p = wibParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/**
 * Tambahkan offset WIB (+07:00) eksplisit ke nilai input[type=datetime-local]
 * (mis. "2026-09-23T20:00") sebelum dikirim ke backend, agar `new Date(...)`
 * di server selalu diinterpretasikan sebagai jam WIB — tidak bergantung pada
 * timezone runtime server (v2.3.7 FR-37.9/37.10).
 */
export function withWibOffset(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) return trimmed;
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
  return `${withSeconds}+07:00`;
}
