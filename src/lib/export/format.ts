import * as XLSX from "xlsx";

/** Format ekspor yang didukung (v1.6 4.4). */
export type ExportFormat = "xlsx" | "csv";

export function parseExportFormat(value: string | null): ExportFormat {
  return value === "csv" ? "csv" : "xlsx";
}

const MIME: Record<ExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
};

export function mimeFor(format: ExportFormat): string {
  return MIME[format];
}

/**
 * Bangun buffer dari satu atau lebih sheet. Untuk CSV hanya sheet pertama yang
 * ditulis (CSV tidak mendukung banyak sheet).
 */
export function buildWorkbook(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  format: ExportFormat,
): Buffer {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }

  if (format === "csv") {
    const first = wb.SheetNames[0];
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[first]);
    // BOM agar karakter Rupiah/UTF-8 terbaca benar di Excel.
    return Buffer.from("﻿" + csv, "utf-8");
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Potongan periode untuk nama file, mis. "Jan2026" atau "Jan-Mar2026". */
export function periodeLabel(from?: Date | null, to?: Date | null): string {
  if (!from && !to) return "Semua";
  const fmt = (d: Date) => `${BULAN[d.getMonth()]}${d.getFullYear()}`;
  if (from && to) {
    const a = fmt(from);
    const b = fmt(to);
    return a === b ? a : `${a}-${b}`;
  }
  return fmt((from ?? to) as Date);
}

/** Bersihkan potongan teks agar aman jadi bagian nama file. */
export function safeSegment(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "Data"
  );
}

/**
 * Nama file deskriptif (v1.6 4.4), mis. "Rekap-Pembayaran-KampanyeX-Jan2026.xlsx".
 */
export function buildFilename(
  base: string,
  parts: (string | null | undefined)[],
  ext: string,
): string {
  const segs = [base, ...parts.filter(Boolean).map((p) => safeSegment(p!))];
  return `${segs.join("-")}.${ext}`;
}
