import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Kebijakan Refund dan Pembatalan Serahin",
  description: "Ketentuan pembatalan dan pengembalian dana pesanan pre-order Serahin.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <PublicPageShell
      eyebrow={`Legal · Versi ${publicSite.policyVersion}`}
      title="Kebijakan Refund dan Pembatalan"
      intro="Berlaku 10 September 2026. Kebijakan ini mempertimbangkan karakter produk pre-order yang dapat mulai diproduksi setelah pesanan dikonfirmasi."
    >
      <h2>Cakupan</h2>
      <p>
        Kebijakan ini berlaku untuk pesanan pelanggan melalui Serahin. Ketentuan
        tambahan yang lebih menguntungkan pembeli dapat dicantumkan pada kampanye
        tertentu dan akan menjadi bagian dari kesepakatan pesanan tersebut.
      </p>
      <h2>Kondisi refund</h2>
      <p>Refund penuh dapat diberikan bila:</p>
      <ul>
        <li>kampanye dibatalkan dan produksi tidak dilanjutkan;</li>
        <li>produk tidak dapat dipenuhi oleh penjual;</li>
        <li>terjadi pembayaran ganda atau kelebihan debit yang terverifikasi; atau</li>
        <li>produk tidak dikirim melewati batas yang disepakati tanpa solusi yang diterima pembeli.</li>
      </ul>
      <p>
        Penggantian atau refund sebagian dapat ditawarkan untuk barang rusak,
        kurang, atau berbeda secara material dari deskripsi setelah bukti ditinjau.
      </p>
      <h2>Pembatalan oleh pembeli</h2>
      <p>
        Pesanan yang belum dibayar dapat dibatalkan. Pesanan yang sudah dibayar
        dapat dibatalkan sebelum produksi dimulai, kecuali kampanye secara jelas
        menyatakan adanya biaya yang sudah tidak dapat dipulihkan. Setelah barang
        khusus mulai diproduksi, refund karena berubah pikiran dapat ditolak.
      </p>
      <h2>Cara mengajukan</h2>
      <p>
        Kirim permintaan ke <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>
        {" "}dengan nama, referensi pesanan, kampanye, alasan, dan bukti pendukung.
        Jangan mengirim PIN atau OTP. Tim akan mengonfirmasi penerimaan dan hasil
        peninjauan melalui kontak yang terverifikasi.
      </p>
      <h2>Metode dan waktu pengembalian</h2>
      <p>
        Refund yang disetujui dikirim melalui metode asal jika didukung penyedia
        pembayaran, atau metode lain yang disepakati setelah verifikasi identitas.
        Target pemrosesan internal adalah 7 hari kerja setelah persetujuan;
        penerimaan akhir dapat bergantung pada bank atau penyedia pembayaran.
      </p>
      <h2>Eskalasi</h2>
      <p>
        Jika masalah belum terselesaikan, hubungi {publicSite.legalName} melalui
        email resmi di atas atau telepon {publicSite.phoneDisplay}.
      </p>
    </PublicPageShell>
  );
}
