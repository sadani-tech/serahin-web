import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { LandingView } from "@/components/revamp/LandingView";

export const metadata: Metadata = {
  title: "Serahin — Kelola Pre-Order dalam Satu Alur",
  description: "Kelola kampanye PO, pesanan, pembayaran, produksi, dan pengalaman pembeli dalam satu tempat yang rapi.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Serahin",
    title: "Serahin — Kelola Pre-Order dalam Satu Alur",
    description: "Dari buka PO sampai barang terkirim, semua lebih rapi bersama Serahin.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Serahin — Pre-Order Lebih Rapi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serahin — Kelola Pre-Order dalam Satu Alur",
    description: "Dari buka PO sampai barang terkirim, semua lebih rapi bersama Serahin.",
    images: [{ url: "/twitter-image", alt: "Serahin — Pre-Order Lebih Rapi" }],
  },
};

export default async function LandingPage() {
  const session = await getSession();
  return <LandingView loggedIn={Boolean(session)} role={session?.role} />;
}
