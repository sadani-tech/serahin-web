"use client";

import { useState } from "react";
import {
  BottomNav,
  DashboardSidebar,
  MobileDrawer,
  MobileMenuButton,
  type NavUser,
} from "@/components/nav";
import { SerahinLogo } from "@/components/brand";
import { ProfileMenu } from "@/components/ProfileMenu";
import { NavigationProgress } from "@/hooks/useNavigationLoading";
import { NavLoadingProvider } from "@/hooks/useNavLoading";

export function AppShell({ children, user }: { children: React.ReactNode; user: NavUser }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dashboardRole = user?.role === "SELLER" ? "SELLER" : "ADMIN";

  return (
    <NavLoadingProvider>
      <NavigationProgress />
      <div className="flex min-h-screen bg-cream-soft">
        <DashboardSidebar role={dashboardRole} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/90 backdrop-blur-md">
            <div aria-hidden="true" className="bg-serahin-ribbon h-1 w-full lg:hidden" />
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                <MobileMenuButton open={drawerOpen} onClick={() => setDrawerOpen((open) => !open)} />
                <SerahinLogo href={dashboardRole === "SELLER" ? "/seller/dashboard" : "/dashboard"} size="sm" />
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">
                  {dashboardRole === "SELLER" ? "Seller workspace" : "Admin workspace"}
                </p>
                <p className="text-sm font-semibold text-sand-500">Kelola operasional Serahin dari satu tempat.</p>
              </div>
              {user && <ProfileMenu user={{ name: user.name, email: user.email, role: dashboardRole }} />}
            </div>
          </header>

          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
            {children}
          </main>

          <footer className="hidden border-t border-sand-200 bg-white py-4 lg:block">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6">
              <p className="text-xs text-sand-500">Serahin · Sistem Manajemen Pre-Order</p>
              <p className="text-xs font-semibold text-brand-600">Pesan hari ini, terima dengan hati</p>
            </div>
          </footer>

          <BottomNav role={dashboardRole} />
        </div>
      </div>
    </NavLoadingProvider>
  );
}
