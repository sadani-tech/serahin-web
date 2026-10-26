import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan Serahin",
  description: "Syarat penggunaan dan pemesanan produk pre-order melalui Serahin.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow={`Legal · Versi ${publicSite.policyVersion}`}
      title="Syarat dan Ketentuan"
      intro="Berlaku 10 September 2026. Ketentuan ini mengatur penggunaan Serahin dan pemesanan produk melalui kampanye pre-order."
    >
      <h2>1. Operator dan ruang lingkup</h2>
      <p>
        Serahin dioperasikan oleh {publicSite.legalName}. Layanan menyediakan
        katalog, formulir pemesanan, pencatatan pembayaran, dan portal status
        untuk produk pre-order yang ditampilkan pada kampanye aktif.
      </p>
      <h2>2. Informasi produk dan kampanye</h2>
      <p>
        Nama produk, varian, harga, kuota, deadline, estimasi produksi, dan
        pengiriman mengikuti informasi pada kampanye saat pesanan dibuat.
        Estimasi bukan jaminan tanggal pasti dan dapat berubah karena proses
        produksi; perubahan material akan diinformasikan melalui kanal yang
        tersedia.
      </p>
      <h2>3. Pemesanan</h2>
      <p>
        Pembeli wajib memberikan nama, kontak, pilihan produk, dan informasi
        pengiriman yang benar. Satu checkout hanya mencakup satu kampanye.
        Pesanan dapat ditolak jika stok tidak tersedia, informasi tidak valid,
        terindikasi duplikat/penyalahgunaan, atau kampanye telah ditutup.
      </p>
      <h2>4. Harga dan pembayaran</h2>
      <p>
        Semua harga ditampilkan dalam Rupiah. Ringkasan checkout menunjukkan
        harga produk, DP atau pelunasan, dan biaya kanal pembayaran jika ada.
        Pembayaran online diproses penyedia payment gateway pihak ketiga.
        Serahin tidak meminta atau menyimpan PIN, OTP, maupun detail kartu mentah.
      </p>
      <h2>5. Kuota dan perubahan harga</h2>
      <p>
        Kuota serta harga divalidasi kembali ketika pesanan dikirim. Jika terjadi
        perubahan, pembeli diminta meninjau ulang sebelum melanjutkan. Serahin
        berhak memperbaiki kesalahan harga yang jelas sebelum transaksi
        diselesaikan dan akan menawarkan pembatalan jika pembeli tidak setuju.
      </p>
      <h2>6. Pembatalan, refund, dan pengiriman</h2>
      <p>
        Ketentuan pembatalan dan pengembalian dana mengikuti{" "}
        <Link href="/refund-policy">Kebijakan Refund dan Pembatalan</Link>.
        Metode serta estimasi pengiriman mengikuti kampanye dan pilihan pembeli.
      </p>
      <h2>7. Penggunaan yang dilarang</h2>
      <p>
        Pengguna dilarang melakukan penipuan, pembayaran tanpa otorisasi,
        manipulasi sistem/kuota, mengunggah konten berbahaya, atau menggunakan
        layanan untuk barang dan aktivitas yang melanggar hukum Indonesia.
      </p>
      <h2>8. Privasi dan komunikasi</h2>
      <p>
        Pengolahan data mengikuti <Link href="/privacy">Kebijakan Privasi</Link>.
        Preferensi pesan non-esensial dapat ditarik dengan menghubungi dukungan.
      </p>
      <h2>9. Perubahan dan hukum yang berlaku</h2>
      <p>
        Perubahan ketentuan berlaku untuk transaksi setelah tanggal versi baru,
        kecuali diwajibkan lain oleh hukum. Ketentuan ini tunduk pada hukum
        Republik Indonesia. Pertanyaan dapat dikirim ke{" "}
        <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>.
      </p>
    </PublicPageShell>
  );
}
