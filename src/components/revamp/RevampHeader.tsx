"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SerahinLogo } from "@/components/brand";
import { useCart } from "@/components/CartProvider";
import { Icon } from "./IconSprite";
import { useHeaderScroll } from "./hooks";

export type RevampNavLink = { href: string; label: string };

/**
 * Header revamp — port struktur dari design/serahin index.html (brand, nav,
 * ikon keranjang, menu mobile). Beda dari mockup: keranjang di sini LANGSUNG
 * ke /cart memakai data asli dari CartProvider (bukan dropdown dummy
 * CART_ITEMS) — konsisten dengan PublicHeader.tsx yang sudah dipakai di
 * seluruh halaman publik lain.
 */
export function RevampHeader({
  navLinks,
  loggedIn = false,
  role,
  showCart = true,
}: {
  navLinks: RevampNavLink[];
  loggedIn?: boolean;
  role?: "ADMIN" | "BUYER" | "SELLER";
  showCart?: boolean;
}) {
  const scrolled = useHeaderScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const cartVisible = showCart && role !== "SELLER";

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menuOpen);
    return () => document.documentElement.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  const accountHref = !loggedIn ? "/account/login" : role === "BUYER" ? "/account" : role === "SELLER" ? "/seller/dashboard" : "/dashboard";

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`} data-header>
      <div className="site-header__inner">
        <SerahinLogo href="/" size="sm" className="brand" />
        <nav className="nav" aria-label="Navigasi utama">
          <ul className="nav__list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav__link">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <Link href={accountHref} className="pill pill--primary">
            {loggedIn ? "Dashboard" : "Masuk"}
          </Link>
          {cartVisible && (
            <Link href="/cart" className="cart__btn" aria-label={`Keranjang, ${count} item`} title="Keranjang">
              <Icon name="cart" />
              <span className="cart__badge" data-empty={count === 0 ? "" : undefined}>{count}</span>
            </Link>
          )}
          <button
            type="button"
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="rv-mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? "x" : "menu"} />
            <span className="sr-only">{menuOpen ? "Tutup menu" : "Buka menu"}</span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="rv-mobile-menu" className="mobile-menu" aria-label="Navigasi mobile">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mobile-menu__cta">
            <Link href={accountHref} className="pill pill--primary" onClick={() => setMenuOpen(false)}>
              {loggedIn ? "Dashboard" : "Masuk"}
            </Link>
            {cartVisible && (
              <Link href="/cart" className="pill pill--katalog" onClick={() => setMenuOpen(false)}>
                Keranjang ({count})
              </Link>
            )}
          </div>
        </nav>
      )}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
