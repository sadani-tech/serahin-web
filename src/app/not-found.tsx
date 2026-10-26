import type { Metadata } from "next";
import { StatusPage } from "@/components/StatusPage";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Halaman tidak ditemukan"
      description="Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau alamatnya salah ketik."
      actions={
        <>
          <LinkButton href="/">Kembali ke Beranda</LinkButton>
          <LinkButton href="/contact" variant="secondary">
            Hubungi Kami
          </LinkButton>
        </>
      }
      footnote="Serahin — Pesan hari ini, terima dengan hati."
    />
  );
}
