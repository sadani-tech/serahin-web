import { readWorkbook, firstSheetRows, field, RawRow } from "./parse";
import { normalizeVarian } from "./status";
import type { VariantCatalogItem } from "./validate";

/** Apakah token merupakan nomor telepon (mayoritas digit, panjang cukup). */
function isPhone(token: string): boolean {
  const digits = token.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s-]+$/.test(token);
}

/**
 * Pisah "Nama - Nomor Whatsapp" (FR-1.2/1.3). Nomor terdeteksi via pola angka;
 * sisanya jadi nama. Field yang tak terdeteksi dibiarkan kosong.
 */
export function parseNamaNomor(raw: string): { nama: string; kontak: string } {
  const s = (raw ?? "").trim();
  if (!s) return { nama: "", kontak: "" };

  // Pecah berdasarkan '-' (variasi spasi apa pun).
  const parts = s.split("-").map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length >= 2) {
    const phonePart = parts.find((p) => isPhone(p));
    const namaParts = parts.filter((p) => p !== phonePart);
    return {
      nama: namaParts.join(" - ").trim(),
      kontak: phonePart ? phonePart.replace(/\s+/g, "") : "",
    };
  }
  // Tanpa pemisah: seluruhnya nomor, atau seluruhnya nama.
  if (isPhone(s)) return { nama: "", kontak: s.replace(/\s+/g, "") };
  return { nama: s, kontak: "" };
}

/**
 * Pisah "Pesanan - Qty" (FR-1.4). Deteksi angka+satuan di akhir sebagai qty,
 * sisanya nama varian. Tanpa qty → 1. Tanpa nama varian jelas → needsManual.
 */
export function parsePesananQty(raw: string): {
  varianInput: string;
  jumlah: number;
} {
  const s = (raw ?? "").trim();
  if (!s) return { varianInput: "", jumlah: 1 };

  // Cari qty di akhir: angka + opsional satuan (pcs/pc/buah).
  const m = s.match(/(\d+)\s*(pcs|pc|buah)?\s*$/i);
  let jumlah = 1;
  let sisa = s;
  if (m) {
    jumlah = Math.max(1, parseInt(m[1], 10));
    sisa = s.slice(0, m.index).trim();
  }
  // Buang pemisah '-' yang menggantung di akhir.
  sisa = sisa.replace(/[-\s]+$/g, "").trim();

  return { varianInput: sisa, jumlah };
}

export type LegacyRow = {
  index: number;
  rawNamaNomor: string;
  rawPesananQty: string;
  rawBukti: string;
  nama: string;
  kontak: string;
  varianInput: string;
  variantId: string | null; // hasil fuzzy match
  jumlah: number;
  needsManualVarian: boolean; // FR-1.4 kondisi 2 / FR-1.5 (blocking)
  dataBelumLengkap: boolean; // nama atau kontak kosong (FR-1.3)
};

/** Parse seluruh file mentah legacy terhadap katalog varian kampanye tujuan. */
export function parseLegacyFile(
  buf: Buffer,
  variants: VariantCatalogItem[],
): LegacyRow[] {
  const wb = readWorkbook(buf);
  const rows = firstSheetRows(wb);
  const byKey = new Map(variants.map((v) => [normalizeVarian(v.namaVarian), v]));

  return rows.map((r: RawRow, i) => {
    const rawNamaNomor = field(r, [
      "Nama - Nomor Whatsapp",
      "Nama - Nomor WA",
      "nama - nomor whatsapp",
      "nama_nomor",
    ]);
    const rawPesananQty = field(r, ["Pesanan - Qty", "pesanan - qty", "pesanan_qty"]);
    const rawBukti = field(r, ["Bukti DP", "bukti dp", "bukti", "bukti_dp"]);

    const { nama, kontak } = parseNamaNomor(rawNamaNomor);
    const { varianInput, jumlah } = parsePesananQty(rawPesananQty);

    const key = normalizeVarian(varianInput);
    const matched = key ? byKey.get(key) : undefined;
    const needsManualVarian = !matched; // varian tak jelas / tak cocok → manual

    return {
      index: i,
      rawNamaNomor,
      rawPesananQty,
      rawBukti,
      nama,
      kontak,
      varianInput,
      variantId: matched?.id ?? null,
      jumlah,
      needsManualVarian,
      dataBelumLengkap: !nama || !kontak,
    };
  });
}
