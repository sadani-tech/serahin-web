"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import {
  NavLinks,
  NavIconActions,
  MobileMenuButton,
  MobileDrawer,
  BottomNav,
  type NavUser,
} from "@/components/nav";
import { SerahinLogo } from "@/components/brand";
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
  const initial = (user?.name ?? user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <NavLoadingProvider>
      <NavigationProgress />
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/90 backdrop-blur-md">
          {/* Pita brand tipis — penanda identitas di puncak setiap halaman. */}
          <div aria-hidden="true" className="bg-serahin-ribbon h-1 w-full" />
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-3">
              <MobileMenuButton
                open={drawerOpen}
                onClick={() => setDrawerOpen((o) => !o)}
              />
              <SerahinLogo href="/" size="sm" />
              <span
                aria-hidden
                className="hidden h-6 w-px bg-sand-200 md:inline-block"
              />
              <NavLinks />
            </div>
            <div className="flex items-center gap-3">
              <NavIconActions />
              <span
                aria-hidden
                className="hidden h-6 w-px bg-sand-200 md:inline-block"
              />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700 ring-1 ring-brand-200">
                  {initial}
                </span>
                <span className="hidden text-sm font-semibold text-sand-700 lg:inline">
                  {user?.name ?? user?.email}
                </span>
              </div>
              <form action={logoutAction} className="hidden md:block">
                <SubmitButton variant="ghost" loadingText="Keluar…">
                  Keluar
                </SubmitButton>
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

        <footer className="hidden border-t border-sand-200 bg-cream-soft py-4 md:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
            <p className="text-xs text-sand-500">
              Serahin · Sistem Manajemen Pre-Order
            </p>
            <p className="text-xs font-semibold text-brand-600">
              Pesan hari ini, terima dengan hati
            </p>
          </div>
        </footer>

        <BottomNav />
      </div>
    </NavLoadingProvider>
  );
}
