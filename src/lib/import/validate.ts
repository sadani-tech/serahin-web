import { ImportMode, OrderStatus, PaymentType } from "@/generated/prisma";
import { RawRow, field, parseAngka, parseTanggal } from "./parse";
import { normalizeVarian, parseOrderStatus, parsePaymentType } from "./status";

export type ParsedSheets = {
  kampanye: RawRow[];
  varian: RawRow[];
  pesanan: RawRow[];
  itemPesanan: RawRow[];
  pembayaran: RawRow[];
};

export type VariantCatalogItem = {
  id?: string;
  namaVarian: string;
  kuotaMaks: number;
  harga?: number; // v1.5
};

export type PesananRow = {
  index: number;
  idRef: string;
  namaPembeli: string;
  kontak: string;
  status: OrderStatus;
  catatan: string;
  errors: string[];
  warnings: string[];
};

export type ItemRow = {
  index: number;
  idRefPesanan: string;
  varianInput: string;
  variantKey: string | null;
  variantId: string | null;
  jumlah: number;
  hargaSaatPesan: number;
  errors: string[];
};

export type PembayaranRow = {
  index: number;
  idRefPesanan: string;
  jenis: PaymentType | null;
  jumlah: number | null;
  tanggal: string | null;
  errors: string[];
};

export type KampanyeParsed = {
  namaProduk: string;
  deskripsi: string;
  harga: number;
  tanggalBuka: string | null;
  tanggalTutup: string | null;
  estimasiProduksi: string | null;
  estimasiKirim: string | null;
  paymentScheme: "DP_PELUNASAN" | "LUNAS";
  dpPercent: number | null;
  deadlinePelunasan: string | null;
  errors: string[];
};

export type ValidationResult = {
  mode: ImportMode;
  kampanye: KampanyeParsed | null;
  varian: {
    namaVarian: string;
    kuotaMaks: number;
    harga: number;
    gambarUrl: string | null;
    errors: string[];
  }[];
  pesanan: PesananRow[];
  items: ItemRow[];
  pembayaran: PembayaranRow[];
  kuotaWarnings: string[];
  ringkasan: {
    pesananValid: number;
    pesananError: number;
    itemValid: number;
    itemError: number;
  };
};

function toISO(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function validateImport(input: {
  mode: ImportMode;
  sheets: ParsedSheets;
  variants: VariantCatalogItem[];
  existingTerisi?: Record<string, number>;
  kuotaMaksByKey?: Record<string, number>;
}): ValidationResult {
  const { mode, sheets } = input;
  const variantByKey = new Map(
    input.variants.map((v) => [normalizeVarian(v.namaVarian), v]),
  );

  // --- Kampanye (Mode A) --------------------------------------------------
  let kampanye: KampanyeParsed | null = null;
  if (mode === "KAMPANYE_PENUH") {
    const r = sheets.kampanye[0] ?? {};
    const errors: string[] = [];
    const namaProduk = field(r, ["nama_produk", "nama produk", "produk"]);
    if (!namaProduk) errors.push("Nama produk wajib diisi");
    const harga = parseAngka(field(r, ["harga"])) ?? 0;
    const tglBuka = parseTanggal(field(r, ["tanggal_buka", "tanggal buka"]));
    const tglTutup = parseTanggal(field(r, ["tanggal_tutup", "tanggal tutup"]));
    if (!tglBuka) errors.push("Tanggal buka tidak valid");
    if (!tglTutup) errors.push("Tanggal tutup tidak valid");
    const schemeRaw = field(r, ["payment_scheme", "skema"]).toUpperCase();
    const paymentScheme = schemeRaw === "LUNAS" ? "LUNAS" : "DP_PELUNASAN";
    kampanye = {
      namaProduk,
      deskripsi: field(r, ["deskripsi"]),
      harga,
      tanggalBuka: toISO(tglBuka),
      tanggalTutup: toISO(tglTutup),
      estimasiProduksi: toISO(parseTanggal(field(r, ["estimasi_produksi"]))),
      estimasiKirim: toISO(parseTanggal(field(r, ["estimasi_kirim"]))),
      paymentScheme,
      dpPercent:
        paymentScheme === "DP_PELUNASAN"
          ? (parseAngka(field(r, ["dp_percent", "dp %"])) ?? 50)
          : null,
      deadlinePelunasan: toISO(parseTanggal(field(r, ["deadline_pelunasan"]))),
      errors,
    };
  }

  // --- Varian (Mode A) — kini wajib harga (FR-3.6) ------------------------
  const varian =
    mode === "KAMPANYE_PENUH"
      ? sheets.varian.map((r) => {
          const namaVarian = field(r, ["nama_varian", "nama varian", "varian"]);
          const kuotaMaks = parseAngka(field(r, ["kuota_maks", "kuota"])) ?? 0;
          const harga = parseAngka(field(r, ["harga"])) ?? 0;
          const gambarUrl =
            field(r, ["url_gambar", "gambar", "url gambar"]) || null;
          const errors: string[] = [];
          if (!namaVarian) errors.push("Nama varian wajib diisi");
          if (kuotaMaks <= 0) errors.push("Kuota maks harus > 0");
          if (harga <= 0) errors.push("Harga varian wajib > 0");
          return { namaVarian, kuotaMaks, harga, gambarUrl, errors };
        })
      : [];

  // --- Pesanan (header) ---------------------------------------------------
  const idRefSet = new Set<string>();
  const dupKontak = new Map<string, number>();
  const pesanan: PesananRow[] = sheets.pesanan.map((r, i) => {
    const idRef = field(r, ["id_referensi", "id ref", "ref"]) || `ROW${i + 1}`;
    const namaPembeli = field(r, ["nama_pembeli", "nama"]);
    const kontak = field(r, ["kontak", "nomor", "wa"]);
    const statusInput = field(r, ["status_pesanan", "status"]);
    const catatan = field(r, ["catatan"]);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!namaPembeli && !kontak) errors.push("Nama & kontak kosong");
    if (idRefSet.has(idRef)) errors.push(`id_referensi ganda: ${idRef}`);
    idRefSet.add(idRef);

    let status = parseOrderStatus(statusInput);
    if (statusInput && !status)
      warnings.push(`Status "${statusInput}" tidak dikenali, dipakai SELESAI`);
    if (!status) status = "SELESAI";

    // Deteksi duplikat sederhana berbasis kontak (FR-3.3 v1.5 / FR-2.5 v1.3)
    if (kontak) {
      const k = kontak.toLowerCase();
      dupKontak.set(k, (dupKontak.get(k) ?? 0) + 1);
      if ((dupKontak.get(k) ?? 0) > 1)
        warnings.push("Kemungkinan duplikat (kontak sama)");
    }

    return { index: i, idRef, namaPembeli, kontak, status, catatan, errors, warnings };
  });

  // --- Item Pesanan -------------------------------------------------------
  const items: ItemRow[] = sheets.itemPesanan.map((r, i) => {
    const idRefPesanan = field(r, [
      "id_referensi_pesanan",
      "id_referensi",
      "id ref pesanan",
    ]);
    const varianInput = field(r, ["varian", "nama_varian"]);
    const jumlah = Math.max(
      1,
      Math.round(parseAngka(field(r, ["jumlah", "qty"])) ?? 1),
    );
    const key = normalizeVarian(varianInput);
    const matched = key ? variantByKey.get(key) : undefined;
    const hargaInput = parseAngka(field(r, ["harga"]));
    const hargaSaatPesan = hargaInput ?? matched?.harga ?? 0;

    const errors: string[] = [];
    if (!idRefPesanan) errors.push("id_referensi_pesanan kosong");
    else if (!idRefSet.has(idRefPesanan))
      errors.push(`id_referensi "${idRefPesanan}" tidak ada di sheet Pesanan`);
    if (!varianInput) errors.push("Varian kosong");
    else if (!matched)
      errors.push(`Varian "${varianInput}" tidak cocok dengan yang terdaftar`);
    if (hargaSaatPesan <= 0) errors.push("Harga item tidak valid");

    return {
      index: i,
      idRefPesanan,
      varianInput,
      variantKey: matched ? key : null,
      variantId: matched?.id ?? null,
      jumlah,
      hargaSaatPesan,
      errors,
    };
  });

  // --- Pembayaran ---------------------------------------------------------
  const pembayaran: PembayaranRow[] = sheets.pembayaran.map((r, i) => {
    const idRefPesanan = field(r, [
      "id_referensi_pesanan",
      "id_referensi",
      "id ref pesanan",
    ]);
    const jenis = parsePaymentType(field(r, ["jenis", "tipe"]));
    const jumlah = parseAngka(field(r, ["jumlah", "nominal"]));
    const tanggal = parseTanggal(field(r, ["tanggal"]));
    const errors: string[] = [];
    if (!idRefPesanan) errors.push("id_referensi_pesanan kosong");
    else if (!idRefSet.has(idRefPesanan))
      errors.push(`id_referensi "${idRefPesanan}" tidak ada di sheet Pesanan`);
    if (!jenis) errors.push("Jenis pembayaran tidak valid (DP/Pelunasan/Lunas)");
    if (jumlah == null || jumlah <= 0) errors.push("Jumlah tidak valid");
    return { index: i, idRefPesanan, jenis, jumlah, tanggal: toISO(tanggal), errors };
  });

  // Pesanan valid harus punya minimal satu item valid.
  const itemValidByRef = new Map<string, number>();
  for (const it of items) {
    if (it.errors.length === 0)
      itemValidByRef.set(
        it.idRefPesanan,
        (itemValidByRef.get(it.idRefPesanan) ?? 0) + 1,
      );
  }
  for (const p of pesanan) {
    if (p.errors.length === 0 && !itemValidByRef.get(p.idRef)) {
      p.errors.push("Tidak ada item valid untuk pesanan ini");
    }
  }

  // --- Peringatan kuota non-blocking (FR-2.4) -----------------------------
  const kuotaWarnings: string[] = [];
  const terisiPerKey = new Map<string, number>(
    Object.entries(input.existingTerisi ?? {}),
  );
  for (const it of items) {
    if (it.variantKey && it.errors.length === 0) {
      terisiPerKey.set(
        it.variantKey,
        (terisiPerKey.get(it.variantKey) ?? 0) + it.jumlah,
      );
    }
  }
  for (const [key, terisi] of terisiPerKey) {
    const maks = input.kuotaMaksByKey?.[key] ?? variantByKey.get(key)?.kuotaMaks ?? 0;
    if (maks > 0 && terisi > maks) {
      const nama = variantByKey.get(key)?.namaVarian ?? key;
      kuotaWarnings.push(
        `Varian "${nama}" akan terisi ${terisi} melebihi kuota ${maks} (data historis — tetap bisa dilanjut).`,
      );
    }
  }

  return {
    mode,
    kampanye,
    varian,
    pesanan,
    items,
    pembayaran,
    kuotaWarnings,
    ringkasan: {
      pesananValid: pesanan.filter((p) => p.errors.length === 0).length,
      pesananError: pesanan.filter((p) => p.errors.length > 0).length,
      itemValid: items.filter((it) => it.errors.length === 0).length,
      itemError: items.filter((it) => it.errors.length > 0).length,
    },
  };
}
