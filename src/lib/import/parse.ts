import * as XLSX from "xlsx";

export type RawRow = Record<string, string>;

/** Baca workbook dari buffer (xlsx atau csv). */
export function readWorkbook(buf: Buffer): XLSX.WorkBook {
  return XLSX.read(buf, { type: "buffer", cellDates: true });
}

/** Ambil baris sebuah sheet (by nama, case-insensitive) sebagai array objek string. */
export function sheetRows(wb: XLSX.WorkBook, name: string): RawRow[] {
  const sheetName = wb.SheetNames.find(
    (n) => n.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows.map((r) => {
    const out: RawRow = {};
    for (const [k, v] of Object.entries(r)) {
      out[k.trim()] = v == null ? "" : String(v).trim();
    }
    return out;
  });
}

/** Ambil baris sheet pertama (untuk file 1-sheet seperti format lawas). */
export function firstSheetRows(wb: XLSX.WorkBook): RawRow[] {
  if (wb.SheetNames.length === 0) return [];
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows.map((r) => {
    const out: RawRow = {};
    for (const [k, v] of Object.entries(r)) {
      out[k.trim()] = v == null ? "" : String(v).trim();
    }
    return out;
  });
}

/** Ambil nilai kolom berdasarkan daftar alias nama header (case-insensitive). */
export function field(row: RawRow, aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const k = keys.find(
      (key) => key.toLowerCase() === alias.toLowerCase(),
    );
    if (k && row[k] !== "") return row[k];
  }
  return "";
}

/** Parsing tanggal fleksibel (Excel date, ISO, dd/mm/yyyy, mm/dd/yyyy). */
export function parseTanggal(value: string): Date | null {
  if (!value) return null;
  const v = value.trim();
  // ISO / yyyy-mm-dd
  const iso = new Date(v);
  if (!Number.isNaN(iso.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(v)) return iso;
  // dd/mm/yyyy atau mm/dd/yyyy
  const m = v.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = Number(m[3]);
    // Heuristik: bila a > 12 pasti hari (dd/mm), selain itu anggap dd/mm (ID).
    const day = a > 12 ? a : a;
    const month = b;
    const d = new Date(y, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(v);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Parsing angka dari string (buang pemisah ribuan / "Rp"). */
export function parseAngka(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}
