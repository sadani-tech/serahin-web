import * as XLSX from "xlsx";

/**
 * Template Mode A — Kampanye Penuh (v1.5, 5 sheet):
 * Kampanye, Varian (harga + url_gambar), Pesanan (header), Item Pesanan, Pembayaran.
 */
export function buildTemplateModeA(): Buffer {
  const wb = XLSX.utils.book_new();

  const kampanye = [
    {
      nama_produk: "Contoh: Kaos Batch Lama",
      deskripsi: "Deskripsi singkat (opsional)",
      harga: 150000,
      tanggal_buka: "2026-01-01",
      tanggal_tutup: "2026-01-14",
      estimasi_produksi: "2026-02-01",
      estimasi_kirim: "2026-02-10",
      payment_scheme: "DP_PELUNASAN",
      dp_percent: 50,
      deadline_pelunasan: "2026-01-30",
    },
  ];
  const varian = [
    { nama_varian: "Ukuran M / Hitam", kuota_maks: 30, harga: 150000, url_gambar: "" },
    { nama_varian: "Ukuran L / Hitam", kuota_maks: 30, harga: 165000, url_gambar: "" },
  ];
  const pesanan = [
    { id_referensi: "P1", nama_pembeli: "Budi", kontak: "081200000001", status_pesanan: "SELESAI", catatan: "" },
    { id_referensi: "P2", nama_pembeli: "Ani", kontak: "081200000002", status_pesanan: "LUNAS", catatan: "" },
  ];
  const itemPesanan = [
    { id_referensi_pesanan: "P1", varian: "Ukuran M / Hitam", jumlah: 1, harga: 150000 },
    { id_referensi_pesanan: "P1", varian: "Ukuran L / Hitam", jumlah: 1, harga: 165000 },
    { id_referensi_pesanan: "P2", varian: "Ukuran L / Hitam", jumlah: 2, harga: 165000 },
  ];
  const pembayaran = [
    { id_referensi_pesanan: "P1", jenis: "DP", jumlah: 157500, tanggal: "2026-01-03" },
    { id_referensi_pesanan: "P1", jenis: "PELUNASAN", jumlah: 157500, tanggal: "2026-01-20" },
    { id_referensi_pesanan: "P2", jenis: "DP", jumlah: 330000, tanggal: "2026-01-04" },
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kampanye), "Kampanye");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(varian), "Varian");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pesanan), "Pesanan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemPesanan), "Item Pesanan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pembayaran), "Pembayaran");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Template Mode B — Pesanan ke kampanye yang sudah ada (v1.5, 3 sheet):
 * Pesanan (header), Item Pesanan, Pembayaran. + referensi varian terdaftar.
 */
export function buildTemplateModeB(variantNames: string[]): Buffer {
  const wb = XLSX.utils.book_new();

  const contohVarian = variantNames[0] ?? "Nama Varian";
  const pesanan = [
    { id_referensi: "P1", nama_pembeli: "Budi", kontak: "081200000001", status_pesanan: "LUNAS", catatan: "" },
  ];
  const itemPesanan = [
    { id_referensi_pesanan: "P1", varian: contohVarian, jumlah: 1, harga: 150000 },
  ];
  const pembayaran = [
    { id_referensi_pesanan: "P1", jenis: "DP", jumlah: 75000, tanggal: "2026-01-03" },
  ];
  const referensi = variantNames.map((v) => ({ varian_terdaftar: v }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pesanan), "Pesanan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemPesanan), "Item Pesanan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pembayaran), "Pembayaran");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(referensi.length ? referensi : [{ varian_terdaftar: "" }]),
    "Varian Terdaftar",
  );

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
