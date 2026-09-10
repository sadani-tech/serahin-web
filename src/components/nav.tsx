"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SerahinLogo } from "@/components/brand";

export type NavUser = { name?: string; email?: string } | null;

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
};

// Navigasi utama (tampil sebagai teks di header desktop).
const links: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/kampanye",
    label: "Kampanye",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    href: "/pembeli",
    label: "Pembeli",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/verifikasi",
    label: "Verifikasi",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    href: "/vendor",
    label: "Vendor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/konten",
    label: "Konten",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/data-privacy",
    label: "Privasi Data",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

// Aksi utilitas — hanya ikon di header (kanan atas), tetap muncul di menu mobile.
const utilityLinks: NavLink[] = [
  {
    href: "/import",
    label: "Import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    href: "/export",
    label: "Export",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

const bottomNavLinks = links.slice(0, 4);
// Menu "Lainnya" di mobile: sisa navigasi utama + aksi utilitas.
const moreLinks = [...links.slice(4), ...utilityLinks];
// Semua menu untuk drawer mobile.
const drawerLinks = [...links, ...utilityLinks];

function useActiveLink() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks() {
  const isActive = useActiveLink();

  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      {links.map((link) => {
        const active = isActive(link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-brand"
                : "text-sand-600 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Ikon aksi utilitas (Import / Export) di kanan header — desktop.
export function NavIconActions() {
  const isActive = useActiveLink();

  return (
    <div className="hidden items-center gap-1 md:flex">
      {utilityLinks.map((link) => {
        const active = isActive(link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            aria-label={link.label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-brand"
                : "text-sand-500 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {link.icon}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-sand-600 transition hover:bg-brand-50 hover:text-brand-700 md:hidden"
      aria-label={open ? "Tutup menu" : "Buka menu"}
    >
      {open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-5 w-5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-5 w-5">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      )}
    </button>
  );
}

export function MobileDrawer({
  open,
  onClose,
  user,
  logoutAction,
}: {
  open: boolean;
  onClose: () => void;
  user: NavUser;
  logoutAction: () => Promise<void>;
}) {
  const isActive = useActiveLink();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-sand-900/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-sand-200 bg-cream-soft px-5 py-4">
          <SerahinLogo size="sm" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-sand-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-sand-400">
            Menu
          </p>
          <ul className="space-y-0.5">
            {drawerLinks.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-600 text-white shadow-brand"
                        : "text-sand-700 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    <span className={active ? "text-sun-300" : "text-sand-400"}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="border-t border-sand-200 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-cream px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-sand-900">
                  {user.name ?? "Admin"}
                </p>
                <p className="truncate text-xs text-sand-500">{user.email}</p>
              </div>
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

export function BottomNav() {
  const isActive = useActiveLink();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 border-t border-sand-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {bottomNavLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-brand-700" : "text-sand-400"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                    active ? "bg-brand-600 text-white scale-110" : ""
                  }`}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              menuOpen ? "text-brand-700" : "text-sand-400"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                menuOpen ? "bg-brand-600 text-white scale-110" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
              </svg>
            </span>
            Lainnya
          </button>
        </div>
      </nav>

      {/* More panel */}
      <div
        className={`fixed inset-x-0 bottom-[57px] z-20 border-t border-sand-200 bg-white shadow-lg transition-all duration-200 md:hidden ${
          menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-3 gap-px bg-sand-100 p-px">
          {moreLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex flex-col items-center gap-2 bg-white px-3 py-4 text-xs font-medium transition-colors ${
                  active ? "text-brand-700" : "text-sand-500"
                }`}
              >
                <span className={`rounded-xl p-2 ${active ? "bg-brand-600 text-white" : "bg-sand-100 text-sand-600"}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => setMenuOpen(false)}
          className="w-full py-2 text-center text-xs font-semibold text-sand-400"
        >
          Tutup
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
