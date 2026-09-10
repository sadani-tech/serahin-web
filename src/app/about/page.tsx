import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Tentang Serahin",
  description: "Tentang Serahin dan layanan pengelolaan produk pre-order.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="Tentang kami"
      title="Pre-order yang lebih mudah dipahami dan dipantau"
      intro="Serahin membantu penjual mengelola kampanye pre-order dan memberi pembeli alur pemesanan yang jelas dari katalog hingga pengiriman."
    >
      <h2>Apa itu Serahin?</h2>
      <p>
        Serahin adalah produk digital yang dioperasikan oleh {publicSite.legalName}.
        Melalui Serahin, penjual dapat mempublikasikan kampanye pre-order,
        mencatat kuota dan varian, mengelola pembayaran, serta memberikan update
        produksi dan pengiriman kepada pembeli.
      </p>
      <h2>Cara layanan bekerja</h2>
      <p>
        Pembeli memilih produk dari kampanye yang sedang dibuka, mengirim data
        pemesanan, dan menggunakan metode pembayaran yang tersedia. Setelah
        pesanan dibuat, pembeli memperoleh tautan portal pribadi untuk memantau
        verifikasi pembayaran dan progres pemenuhan pesanan.
      </p>
      <h2>Karakteristik pre-order</h2>
      <p>
        Produk pre-order dapat memerlukan waktu produksi setelah periode
        pemesanan ditutup. Harga, deadline, estimasi produksi, metode pembayaran,
        dan informasi pengiriman mengikuti keterangan masing-masing kampanye.
      </p>
      <h2>Operator</h2>
      <p>
        {publicSite.legalName}<br />
        {publicSite.location}<br />
        <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>
      </p>
    </PublicPageShell>
  );
}
