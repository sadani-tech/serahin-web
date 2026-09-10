import Link from "next/link";
import { SerahinLogo } from "@/components/brand";

export function PublicHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur-md">
      <div aria-hidden="true" className="bg-serahin-ribbon h-1 w-full" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <SerahinLogo href="/" size="sm" />
        <nav
          aria-label="Navigasi publik"
          className="flex items-center gap-1 sm:gap-2"
        >
          <Link
            href="/#catalog"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
          >
            Katalog
          </Link>
          <Link
            href="/#cara-kerja"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 md:inline-flex"
          >
            Cara Kerja
          </Link>
          <Link
            href="/#faq"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
          >
            Kontak
          </Link>
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand hover:bg-brand-700"
          >
            {loggedIn ? "Buka Dashboard" : "Login Seller"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
