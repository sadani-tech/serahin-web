import Link from "next/link";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { RevampFooter } from "@/components/revamp/RevampFooter";

const NAV_LINKS = [
  { href: "/#kenapa", label: "Kenapa Serahin" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Kontak" },
];

export function PublicPageShell({
  title,
  eyebrow,
  intro,
  children,
  minimalHeader = false,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  children: React.ReactNode;
  /** Sembunyikan nav Buyer di header — dipakai halaman pendaftaran/aktivasi Seller. */
  minimalHeader?: boolean;
}) {
  return (
    <div className="rv-scope js is-loaded">
      <IconSprite />
      {/* navLinks kosong = nav minimal, setara prop `minimal` di PublicHeader
          lama (dipakai halaman pendaftaran/aktivasi Seller). */}
      <RevampHeader navLinks={minimalHeader ? [] : NAV_LINKS} showCart={!minimalHeader} />
      <main className="legal-page">
        <div className="legal-page__inner">
          <Link href="/" className="legal-page__back">
            ← Kembali ke beranda
          </Link>
          <header className="legal-page__hero">
            <p className="legal-page__eyebrow">{eyebrow}</p>
            <h1 className="legal-page__title font-head">{title}</h1>
            <p className="legal-page__intro">{intro}</p>
          </header>
          <article className="prose-serahin legal-page__card">
            {children}
          </article>
        </div>
      </main>
      <RevampFooter />
    </div>
  );
}
