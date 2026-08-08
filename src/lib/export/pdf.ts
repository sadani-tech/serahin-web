import PDFDocument from "pdfkit";
import { formatRupiah } from "@/lib/format";
import type { KeuanganSummary } from "./keuangan";

/**
 * Bangun PDF ringkasan keuangan visual (v1.6 4.2).
 * Menggabungkan chunk stream menjadi satu Buffer.
 */
export function buildKeuanganPdf(params: {
  summary: KeuanganSummary;
  judul: string;
  keterangan: string;
}): Promise<Buffer> {
  const { summary, judul, keterangan } = params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- Header ---
    doc
      .fontSize(18)
      .fillColor("#0f172a")
      .text("Serahin — Rekap Pembayaran", { align: "left" });
    doc
      .moveDown(0.2)
      .fontSize(11)
      .fillColor("#475569")
      .text(judul);
    doc
      .moveDown(0.1)
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(keterangan);
    doc
      .fontSize(9)
      .fillColor("#94a3b8")
      .text(`Dibuat: ${new Date().toLocaleString("id-ID")}`);

    doc.moveDown(1);

    // --- Kartu ringkasan ---
    const cards: [string, string, string][] = [
      ["Total Transaksi", String(summary.totalTransaksi), "#0f172a"],
      ["Terverifikasi", formatRupiah(summary.totalTerverifikasi), "#059669"],
      ["Menunggu Verifikasi", formatRupiah(summary.totalMenunggu), "#d97706"],
      ["Ditolak", formatRupiah(summary.totalDitolak), "#e11d48"],
    ];

    const startX = 50;
    const cardW = 122;
    const gap = 8;
    const cardY = doc.y;
    cards.forEach(([label, value, color], i) => {
      const x = startX + i * (cardW + gap);
      doc
        .roundedRect(x, cardY, cardW, 60, 6)
        .fillAndStroke("#f8fafc", "#e2e8f0");
      doc
        .fontSize(8)
        .fillColor("#64748b")
        .text(label, x + 10, cardY + 12, { width: cardW - 20 });
      doc
        .fontSize(13)
        .fillColor(color)
        .text(value, x + 10, cardY + 30, { width: cardW - 20 });
    });

    doc.y = cardY + 80;
    doc.x = 50;

    // --- Tabel per kampanye ---
    doc
      .moveDown(1)
      .fontSize(13)
      .fillColor("#0f172a")
      .text("Rincian per Kampanye");
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colKampanye = 50;
    const colTx = 330;
    const colTotal = 400;

    doc.fontSize(9).fillColor("#64748b");
    doc.text("Kampanye", colKampanye, tableTop);
    doc.text("Transaksi", colTx, tableTop);
    doc.text("Terverifikasi", colTotal, tableTop);
    doc
      .moveTo(50, tableTop + 14)
      .lineTo(545, tableTop + 14)
      .strokeColor("#e2e8f0")
      .stroke();

    let y = tableTop + 20;
    doc.fontSize(10).fillColor("#0f172a");
    if (summary.perKampanye.length === 0) {
      doc.fillColor("#94a3b8").text("Tidak ada data transaksi.", colKampanye, y);
    } else {
      for (const r of summary.perKampanye) {
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
        doc.fillColor("#0f172a").fontSize(10);
        doc.text(r.kampanye, colKampanye, y, { width: 270 });
        doc.text(String(r.jumlahTransaksi), colTx, y);
        doc.text(formatRupiah(r.totalTerverifikasi), colTotal, y);
        y += 20;
      }
    }

    doc.end();
  });
}
