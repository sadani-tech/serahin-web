"use client";

import Link from "next/link";
import { CartIcon, SerahinLogo } from "@/components/brand";
import { useCart } from "@/components/CartProvider";
import { ProfileMenu } from "@/components/ProfileMenu";

export function PublicHeader({
  loggedIn = false,
  role,
  name,
  email,
  avatarUrl,
  minimal = false,
  catalogNav = false,
}: {
  loggedIn?: boolean;
  role?: "ADMIN" | "BUYER" | "SELLER";
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  /** Sembunyikan nav Buyer (Katalog/FAQ/Arsip/Kontak/keranjang/Masuk Buyer) —
   * dipakai di halaman pendaftaran/aktivasi Seller agar navigasi tidak
   * membingungkan calon Seller (v2.3.7). */
  minimal?: boolean;
  /** Halaman Katalog (v2.3.9 FR-42.11): sembunyikan link navigasi
   * (Katalog/FAQ/Arsip/Kontak), sisakan hanya keranjang + Masuk/profil. */
  catalogNav?: boolean;
}) {
  const { count } = useCart();
  // Seller tidak berbelanja sebagai Buyer — ikon keranjang disembunyikan di
  // mana pun PublicHeader dipakai saat login sebagai Seller (v2.3.9 FR-42.11).
  const showCart = role !== "SELLER";
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur-md">
      <div aria-hidden="true" className="bg-serahin-ribbon h-1 w-full" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <SerahinLogo href="/" size="sm" />
        {!minimal && (
        <nav
          aria-label="Navigasi publik"
          className="flex items-center gap-1 sm:gap-2"
        >
          {!catalogNav && (
            <>
              <Link
                href="/catalog"
                className="hidden min-h-11 items-center rounded-full px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
              >
                Katalog
              </Link>
              <Link
                href="/#faq"
                className="hidden min-h-11 items-center rounded-full px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
              >
                FAQ
              </Link>
              <Link href="/arsip" className="hidden min-h-11 items-center rounded-full px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 xl:inline-flex">Arsip</Link>
              <Link
                href="/contact"
                className="hidden min-h-11 items-center rounded-full px-3 text-sm font-bold text-sand-600 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
              >
                Kontak
              </Link>
            </>
          )}
          {showCart && (
            <Link
              href="/cart"
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition hover:scale-105 hover:bg-brand-100"
              aria-label={`Keranjang, ${count} item`}
              title="Keranjang"
            >
              <CartIcon className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full border-2 border-white bg-accent-600 px-1 py-0.5 text-[10px] font-extrabold leading-none text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )}
          {loggedIn && role ? (
            <ProfileMenu user={{ name, email, role, avatarUrl }} />
          ) : (
            <Link href="/account/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand hover:bg-brand-700">
              Masuk
            </Link>
          )}
        </nav>
        )}
      </div>
    </header>
  );
}
