import Link from "next/link";
import { getFooterPages } from "@/lib/cms";
import { SerahinMark } from "@/components/brand";
import { publicSite, requiredLegalLinks } from "@/lib/public-site";

/** Footer publik dengan tautan legal stabil serta halaman CMS tambahan. */
export async function PublicFooter() {
  const pages = await getFooterPages().catch(() => []);
  const reserved = new Set([
    "about",
    "contact",
    "terms",
    "refund-policy",
    "privacy",
    "data-deletion",
  ]);

  return (
    <footer className="mt-10 border-t border-sand-200 bg-white/70 py-7">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center">
        <SerahinMark className="h-8 w-8" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
          Pesan hari ini, terima dengan hati
        </p>
        <p className="max-w-xl text-xs leading-5 text-sand-500">
          {publicSite.name} dioperasikan oleh {publicSite.legalName}. Dukungan:{" "}
          <a
            className="font-bold text-brand-700 hover:underline"
            href={`mailto:${publicSite.email}`}
          >
            {publicSite.email}
          </a>
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          aria-label="Informasi dan kebijakan"
        >
          {requiredLegalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-sand-600 hover:text-brand-700 hover:underline"
            >
              {link.label}
            </Link>
          ))}
          {pages
            .filter((page) => !reserved.has(page.slug))
            .map((page) => (
              <Link
                key={page.slug}
                href={`/halaman/${page.slug}`}
                className="text-xs font-medium text-sand-600 hover:text-brand-700 hover:underline"
              >
                {page.judul}
              </Link>
            ))}
        </nav>
        <p className="text-xs text-sand-500">
          © {new Date().getFullYear()} {publicSite.legalName} · Serahin
        </p>
      </div>
    </footer>
  );
}
