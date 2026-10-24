import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { SerahinLogo } from "@/components/brand";
import { ProfileMenu } from "@/components/ProfileMenu";
import { getBuyerAvatarUrl } from "@/lib/buyer-avatar";
import { AccountCartLink } from "../AccountCartLink";

/** Header dashboard Buyer — hanya untuk rute di grup ini. Navigasi
 * (Pesanan/Checkout/Profil) ada di dropdown ProfileMenu, bukan di header,
 * supaya header tetap ringkas di layar kecil. */
export default async function AccountDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  const isBuyer = user?.role === "BUYER";
  const avatarUrl = isBuyer ? await getBuyerAvatarUrl(user) : null;
  return (
    <>
      <header className="border-b border-sand-200 bg-white">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <SerahinLogo href="/" size="sm" />
          {isBuyer && (
            <div className="ml-auto flex items-center gap-2">
              <AccountCartLink />
              <ProfileMenu user={{ name: user.name, email: user.email, role: "BUYER", avatarUrl }} />
            </div>
          )}
        </nav>
      </header>
      <div className="dashboard-main bg-serahin-dashboard min-h-full">{children}</div>
    </>
  );
}
