"use client";

import Link from "next/link";
import { CartIcon, SerahinLogo } from "@/components/brand";
import { useCart } from "@/components/CartProvider";
import { ProfileMenu } from "@/components/ProfileMenu";

export function PublicHeader({ loggedIn = false, role, name, email }: { loggedIn?: boolean; role?: "ADMIN" | "BUYER" | "SELLER"; name?: string | null; email?: string | null }) {
  const { count } = useCart();
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
            href="/catalog"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
          >
            Katalog
          </Link>
          <Link
            href="/#faq"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
          >
            FAQ
          </Link>
          <Link href="/arsip" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 xl:inline-flex">Arsip</Link>
          <Link
            href="/contact"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
          >
            Kontak
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sand-700 hover:bg-brand-50 hover:text-brand-700"
            aria-label={`Keranjang, ${count} item`}
            title="Keranjang"
          >
            <CartIcon className="h-6 w-6 text-brand-700" />
            {count > 0 && <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-[11px] text-white">{count > 99 ? "99+" : count}</span>}
          </Link>
          {loggedIn && role ? (
            <ProfileMenu user={{ name, email, role }} />
          ) : (
            <Link href="/account/login" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand hover:bg-brand-700">
              Masuk Buyer
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
