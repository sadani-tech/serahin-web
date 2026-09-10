import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";
import { publicSite } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Kontak Serahin",
  description: "Kontak dukungan untuk pesanan dan pembayaran Serahin.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Dukungan"
      title="Hubungi Serahin"
      intro="Sertakan nama kampanye dan referensi pesanan agar tim kami dapat membantu lebih cepat. Jangan pernah mengirim PIN atau OTP."
    >
      <h2>Email dukungan</h2>
      <p>
        <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>
      </p>
      <h2>Telepon dan WhatsApp bisnis</h2>
      <p>
        <a href={`tel:${publicSite.phoneHref}`}>{publicSite.phoneDisplay}</a>
      </p>
      <h2>Lokasi bisnis</h2>
      <p>{publicSite.location}</p>
      <h2>Keamanan komunikasi</h2>
      <p>
        Tim Serahin tidak pernah meminta password, PIN, OTP, atau nomor kartu
        lengkap. Untuk kendala pembayaran, cukup kirim referensi pesanan dan
        keterangan masalah melalui kontak resmi di halaman ini.
      </p>
    </PublicPageShell>
  );
}
