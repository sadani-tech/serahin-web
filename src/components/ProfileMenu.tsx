"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import type { UserRole } from "@/lib/types";

type ProfileUser = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin internal",
  SELLER: "Seller",
  BUYER: "Buyer",
};

const roleLinks: Record<UserRole, Array<{ href: string; label: string }>> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard Admin" },
    { href: "/seller-applications", label: "Aplikasi Seller" },
  ],
  SELLER: [
    { href: "/seller/dashboard", label: "Dashboard Seller" },
    { href: "/seller/dashboard#profil-bisnis", label: "Profil bisnis" },
  ],
  BUYER: [
    { href: "/account", label: "Pesanan Saya" },
    { href: "/account/profile", label: "Profil akun" },
  ],
};

export function ProfileMenu({ user, align = "right" }: { user: ProfileUser; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const initial = (user.name ?? user.email ?? roleLabel[user.role]).charAt(0).toUpperCase();

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
          {initial}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-36 truncate text-xs font-extrabold text-sand-900">{user.name ?? user.email ?? roleLabel[user.role]}</span>
          <span className="block text-[10px] font-bold uppercase tracking-wide text-sand-400">{roleLabel[user.role]}</span>
        </span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={`hidden h-4 w-4 text-sand-400 transition sm:block ${open ? "rotate-180" : ""}`}>
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="border-b border-sand-100 bg-cream-soft px-4 py-3">
            <p className="truncate text-sm font-extrabold text-sand-900">{user.name ?? roleLabel[user.role]}</p>
            {user.email && <p className="truncate text-xs text-sand-500">{user.email}</p>}
          </div>
          <div className="p-2">
            {roleLinks[user.role].map((item) => (
              <Link key={item.href} role="menuitem" href={item.href} onClick={() => setOpen(false)} className="flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-sand-700 hover:bg-brand-50 hover:text-brand-700">
                {item.label}
              </Link>
            ))}
            <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-sand-700 hover:bg-brand-50 hover:text-brand-700">
              Lihat storefront
            </Link>
          </div>
          <form action={logoutAction} className="border-t border-sand-100 p-2">
            <button role="menuitem" type="submit" className="flex min-h-10 w-full items-center rounded-xl px-3 text-sm font-extrabold text-rose-700 hover:bg-rose-50">
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
