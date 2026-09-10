import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Kebijakan Privasi Serahin",
  description: "Cara Serahin mengumpulkan, menggunakan, dan melindungi data pengguna.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow={`Legal · Versi ${publicSite.policyVersion}`}
      title="Kebijakan Privasi"
      intro="Berlaku 10 September 2026. Kebijakan ini menjelaskan pemrosesan data ketika Anda menggunakan katalog, membuat pesanan, melakukan pembayaran, atau menghubungi Serahin."
    >
      <h2>1. Pengendali data</h2>
      <p>
        Serahin dioperasikan oleh {publicSite.legalName}, berlokasi di{" "}
        {publicSite.location}. Pertanyaan privasi dapat dikirim ke{" "}
        <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>.
      </p>
      <h2>2. Data yang kami proses</h2>
      <ul>
        <li>nama, nomor WhatsApp, dan alamat email;</li>
        <li>alamat serta pilihan pengiriman ketika diperlukan;</li>
        <li>kampanye, produk, varian, jumlah, catatan, dan status pesanan;</li>
        <li>bukti transfer manual atau referensi/status transaksi gateway;</li>
        <li>persetujuan kebijakan dan preferensi komunikasi; serta</li>
        <li>log teknis terbatas untuk keamanan, pencegahan penyalahgunaan, dan keandalan layanan.</li>
      </ul>
      <p>
        PIN, OTP, password perbankan, dan nomor kartu lengkap dimasukkan pada
        sistem penyedia pembayaran dan tidak disimpan oleh Serahin.
      </p>
      <h2>3. Tujuan pemrosesan</h2>
      <p>
        Data digunakan untuk membuat dan memenuhi pesanan, memverifikasi serta
        merekonsiliasi pembayaran, memberikan portal status, mengirim komunikasi
        yang disetujui, menangani dukungan/refund, mencegah fraud, memenuhi
        kewajiban hukum, dan menjaga keamanan sistem.
      </p>
      <h2>4. Dasar pemrosesan dan consent</h2>
      <p>
        Pemrosesan inti dilakukan untuk menjalankan permintaan/transaksi Anda,
        memenuhi kewajiban hukum, dan kepentingan sah dalam menjaga layanan.
        Komunikasi non-esensial hanya dilakukan berdasarkan persetujuan yang dapat
        ditarik. Penarikan tidak memengaruhi pemrosesan yang telah sah sebelumnya.
      </p>
      <h2>5. Pihak yang menerima data</h2>
      <p>
        Data dapat dibagikan secara terbatas kepada penjual/vendor pemenuhan yang
        relevan, penyedia hosting dan email, payment gateway, Meta/WhatsApp untuk
        pesan yang diaktifkan, konsultan profesional, atau otoritas bila diwajibkan
        hukum. Serahin tidak menjual data pribadi.
      </p>
      <h2>6. Penyimpanan dan transfer</h2>
      <p>
        Data disimpan selama diperlukan untuk pesanan, dukungan, audit, akuntansi,
        pencegahan fraud, dan penyelesaian sengketa. Penyedia pihak ketiga dapat
        memproses data di lokasi lain sesuai kontrak serta perlindungan yang
        berlaku. Data yang tidak lagi diperlukan akan dihapus atau dianonimkan.
      </p>
      <h2>7. Keamanan</h2>
      <p>
        Kami menggunakan kontrol akses, koneksi terenkripsi, validasi input,
        pembatasan akses operasional, dan pencatatan audit secara proporsional.
        Tidak ada sistem yang sepenuhnya bebas risiko; laporkan dugaan insiden ke
        kontak privasi kami.
      </p>
      <h2>8. Hak Anda</h2>
      <p>
        Sesuai ketentuan yang berlaku, Anda dapat meminta akses, koreksi,
        pembaruan, penarikan consent tertentu, atau penghapusan data. Gunakan{" "}
        <Link href="/data-deletion">halaman Penghapusan Data</Link>. Sebagian data
        transaksi dapat tetap disimpan jika diperlukan oleh hukum, audit, fraud,
        atau sengketa; alasannya akan dijelaskan pada respons permintaan.
      </p>
      <h2>9. Anak-anak</h2>
      <p>
        Pengguna yang belum cakap secara hukum harus menggunakan layanan dengan
        persetujuan orang tua atau wali. Hubungi kami bila data anak diberikan
        tanpa wewenang yang sesuai.
      </p>
      <h2>10. Perubahan kebijakan</h2>
      <p>
        Versi dan tanggal berlaku ditampilkan pada halaman ini. Perubahan material
        akan diumumkan melalui situs atau kanal kontak yang sesuai.
      </p>
    </PublicPageShell>
  );
}
