"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { NavLinks, NavIconActions, MobileMenuButton, MobileDrawer, BottomNav, type NavUser } from "@/components/nav";
import { SubmitButton } from "@/components/SubmitButton";
import { NavigationProgress } from "@/hooks/useNavigationLoading";
import { NavLoadingProvider } from "@/hooks/useNavLoading";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: NavUser;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <NavLoadingProvider>
      <NavigationProgress />
      <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <MobileMenuButton open={drawerOpen} onClick={() => setDrawerOpen((o) => !o)} />
            <Link href="/" className="text-lg font-bold text-slate-900">
              Serahin
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <NavIconActions />
            <span className="hidden h-6 w-px bg-slate-200 md:inline-block" aria-hidden />
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.name ?? user?.email}
            </span>
            <form action={logoutAction} className="hidden md:block">
              <SubmitButton variant="ghost" loadingText="Keluar…">Keluar</SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        logoutAction={logoutAction}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:py-8 md:pb-8">
        {children}
      </main>

      <footer className="hidden border-t border-slate-200 py-4 md:block">
        <p className="mx-auto max-w-6xl px-4 text-xs text-slate-400">
          Serahin · Sistem Manajemen Pre-Order v1.0
        </p>
      </footer>

      <BottomNav />
    </div>
    </NavLoadingProvider>
  );
}
