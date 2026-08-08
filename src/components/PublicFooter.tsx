import Link from "next/link";
import { getFooterPages } from "@/lib/cms";

/**
 * Footer halaman publik (Form PO v1.2 & Portal v1.1) dengan tautan ke halaman
 * statis terpublikasi (v1.6 3.1).
 */
export async function PublicFooter() {
  const pages = await getFooterPages();

  return (
    <footer className="mt-10 border-t border-slate-200 py-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 text-center">
        {pages.length > 0 && (
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/halaman/${p.slug}`}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
              >
                {p.judul}
              </Link>
            ))}
          </nav>
        )}
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Serahin · Sistem Manajemen Pre-Order
        </p>
      </div>
    </footer>
  );
}
