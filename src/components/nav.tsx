"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export type NavUser = { name?: string; email?: string } | null;

const links = [
  {
    href: "/",
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
    href: "/vendor",
    label: "Vendor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
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

function useActiveLink() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks() {
  const isActive = useActiveLink();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleNav = (href: string) => {
    setIsLoading(true);
    router.push(href);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      {links.map((link) => {
        const active = isActive(link.href, link.exact);
        return (
          <button
            key={link.href}
            onClick={() => handleNav(link.href)}
            disabled={isLoading}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
          >
            {link.label}
          </button>
        );
      })}
    </nav>
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
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
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
  const [isLoading, setIsLoading] = useState(false);

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
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
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
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="text-lg font-bold text-slate-900">Serahin</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Menu
          </p>
          <ul className="space-y-0.5">
            {links.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => {
                      setIsLoading(true);
                      onClose();
                      setTimeout(() => setIsLoading(false), 300);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-slate-400"}>
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
        <div className="border-t border-slate-100 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {user.name ?? "Admin"}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {bottomNavLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 300);
                }}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-slate-900" : "text-slate-400"
                } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                    active ? "bg-slate-900 text-white scale-110" : ""
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
              menuOpen ? "text-slate-900" : "text-slate-400"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                menuOpen ? "bg-slate-900 text-white scale-110" : ""
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
        className={`fixed inset-x-0 bottom-[57px] z-20 border-t border-slate-200 bg-white shadow-lg transition-all duration-200 md:hidden ${
          menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-3 gap-px bg-slate-100 p-px">
          {links.slice(4).map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMenuOpen(false);
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 300);
                }}
                className={`flex flex-col items-center gap-2 bg-white px-3 py-4 text-xs font-medium transition-colors ${
                  active ? "text-slate-900" : "text-slate-500"
                } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
              >
                <span className={`rounded-xl p-2 ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => setMenuOpen(false)}
          className="w-full py-2 text-center text-xs text-slate-400"
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
