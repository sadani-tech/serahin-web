import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";
import { SellerPortalActions } from "./SellerPortalActions";
import { SellerApplicationForm } from "./SellerApplicationForm";

export const metadata: Metadata = {
  title: "Menjadi Seller Serahin",
  description:
    "Ketentuan, tanggung jawab, dan cara mengajukan diri sebagai Seller Serahin.",
  alternates: { canonical: "/seller" },
};

export default function SellerPage() {
  return (
    <PublicPageShell
      eyebrow="Untuk Seller"
      title="Kelola pre-order dengan lebih rapi bersama Serahin"
      intro="Serahin membantu Seller menampilkan produk, mengatur Batch PO, memantau pesanan, dan menjaga pembeli tetap mendapat informasi yang jelas."
    >
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mt-0">Tertarik menjadi Seller?</h2>
          <p className="mb-0 text-sm leading-6 text-sand-600">
            Pengajuan Seller saat ini ditinjau oleh Admin sebelum katalog dan
            Batch PO dapat dipublikasikan.
          </p>
        </div>
        <SellerPortalActions />
      </div>

      <h2>Ketentuan menjadi Seller</h2>
      <ul>
        <li>Memiliki identitas dan kontak bisnis yang dapat diverifikasi.</li>
        <li>Menjelaskan produk, varian, harga, kuota, dan estimasi dengan jujur.</li>
        <li>Memahami karakter pre-order dan siap memenuhi pesanan sesuai Batch PO.</li>
        <li>Menunjuk kontak resmi untuk komunikasi dengan Admin dan pembeli.</li>
        <li>Menyetujui Syarat &amp; Ketentuan serta Kebijakan Privasi Serahin.</li>
      </ul>

      <h2>Tanggung jawab Seller</h2>
      <ul>
        <li>Memastikan informasi katalog dan status Batch PO selalu diperbarui.</li>
        <li>Menindaklanjuti pesanan, pembayaran, produksi, dan pengiriman sesuai alur.</li>
        <li>Memberikan update ketika terjadi perubahan jadwal, stok, atau kualitas.</li>
        <li>Tidak menggunakan data pembeli di luar kebutuhan pemenuhan pesanan.</li>
        <li>Segera melaporkan kesalahan data, akses mencurigakan, atau insiden privasi.</li>
      </ul>

      <h2>Perhatian tentang privasi dan keamanan</h2>
      <p>
        Data pembeli adalah informasi terbatas untuk kebutuhan pemrosesan pesanan
        dan pengiriman. Seller tidak boleh menyalin, menjual, menyebarkan, atau
        menghubungi pembeli untuk promosi di luar konteks pesanan tanpa dasar yang
        sah dan persetujuan yang sesuai.
      </p>
      <p>
        Gunakan password yang kuat, jangan membagikan password, PIN, OTP, atau
        tautan akses. Jika akun atau data pesanan diduga diakses pihak lain,
        hubungi {publicSite.email} secepatnya.
      </p>

      <h2>Alur pengajuan</h2>
      <ol>
        <li>Kirim pengajuan melalui tombol <strong>Ajukan Registrasi</strong>.</li>
        <li>Admin meninjau identitas, produk, dan kesiapan operasional.</li>
        <li>Setelah disetujui, Admin membantu menyiapkan profil dan Batch PO.</li>
        <li>Seller dapat mengelola katalog dan pesanan sesuai hak akses yang diberikan.</li>
      </ol>
      <h2 id="seller-application">Form pengajuan Seller</h2>
      <SellerApplicationForm />
    </PublicPageShell>
  );
}
