import Link from "next/link";
import { getFooterPages } from "@/lib/cms";
import { SerahinMark } from "@/components/brand";

/**
 * Footer halaman publik (Form PO v1.2 & Portal v1.1) dengan tautan ke halaman
 * statis terpublikasi (v1.6 3.1).
 */
export async function PublicFooter() {
  const pages = await getFooterPages();

  return (
    <footer className="mt-10 border-t border-sand-200 py-7">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 text-center">
        <SerahinMark className="h-8 w-8" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
          Pesan hari ini, terima dengan hati
        </p>
        {pages.length > 0 && (
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/halaman/${p.slug}`}
                className="text-xs font-medium text-sand-600 hover:text-brand-700 hover:underline"
              >
                {p.judul}
              </Link>
            ))}
          </nav>
        )}
        <p className="text-xs text-sand-500">
          © {new Date().getFullYear()} Serahin · Sistem Manajemen Pre-Order
        </p>
      </div>
    </footer>
  );
}
