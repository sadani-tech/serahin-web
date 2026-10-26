import Link from "next/link";
import { SerahinLogo } from "@/components/landing/brand";
import { AuthChoiceModal } from "@/components/landing/AuthChoiceModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import type { UserRole } from "@/lib/types";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
};

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <a className="logo-link" href="#top" aria-label="Serahin, kembali ke atas">
          <SerahinLogo />
        </a>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#pembeli">Pembeli</a>
          <a href="#testimoni">Testimoni</a>
          <a href="#roadmap">Roadmap</a>
          <Link href="/catalog">Katalog Buyer</Link>
        </nav>

        {user ? (
          <div className="desktop-login landing-profile-menu">
            <ProfileMenu user={user} />
          </div>
        ) : (
          <AuthChoiceModal />
        )}

        <details className="mobile-menu-details">
          <summary className="menu-button" aria-label="Buka menu navigasi">
            <span/><span/><span/>
          </summary>
          <div className="mobile-menu-panel">
            <nav className="container" aria-label="Navigasi seluler">
              <a href="#fitur">Fitur</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#pembeli">Pembeli</a>
              <a href="#testimoni">Testimoni</a>
              <a href="#roadmap">Roadmap</a>
              <Link href="/catalog">Katalog Buyer</Link>
              {user ? (
                <div className="landing-profile-menu--mobile">
                  <ProfileMenu user={user} align="left" />
                </div>
              ) : (
                <AuthChoiceModal mobile />
              )}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
