import type { ReactNode } from "react";
import Link from "next/link";
import { SerahinLogo } from "@/components/brand";
import { PublicFooter } from "@/components/PublicFooter";
import { IconSprite, Icon } from "@/components/revamp/IconSprite";

/**
 * Shell auth revamp (login/register/activate/forgot/reset-password Buyer, +
 * seller/login) — diport dari libraries/serahin-docs/design/serahin
 * login.css/daftar.css, lalu panel foto diganti panel brand gelap tanpa foto
 * model (lihat auth__media di revamp.css). Logo+judul+form di kanan.
 * <AuthForm> (fields, submit, validasi, Google sign-in) dirender apa adanya
 * lewat {children} — TIDAK direstyle di sini, lihat AuthForm.tsx.
 */
export function AuthShell({
  title,
  copy,
  children,
}: {
  title: ReactNode;
  copy: string;
  children: ReactNode;
}) {
  return (
    <div className="rv-scope js is-ready flex min-h-full flex-1 flex-col">
      <IconSprite />
      <main className="auth">
        <aside className="auth__media" aria-hidden="true">
          <span className="auth__media-grid" />
          <span className="auth__media-glow" />
          <Link className="auth__media-brand" href="/" tabIndex={-1}>
            <SerahinLogo size="sm" tone="onDark" />
          </Link>
          <div className="auth__media-copy">
            <h2 className="auth__media-title">Kelola pre-order dari satu tempat yang rapi.</h2>
            <p className="auth__media-lead">Kampanye, pembayaran, dan pengiriman tersusun dalam satu alur — tanpa spreadsheet dan chat yang tercecer.</p>
            <div className="auth__media-chips">
              <span className="auth__media-chip"><Icon name="check" />Buyer tanpa akun</span>
              <span className="auth__media-chip"><Icon name="check" />DP &amp; pelunasan fleksibel</span>
            </div>
          </div>
        </aside>

        <section className="auth__panel" aria-labelledby="auth-title">
          <div className="auth__inner">
            <Link className="auth__brand" href="/" aria-label="Serahin — ke beranda" data-step style={{ "--i": 0 } as React.CSSProperties}>
              <SerahinLogo size="sm" />
            </Link>

            <Link className="auth__back" href="/" data-step style={{ "--i": 0 } as React.CSSProperties}>
              <Icon name="arrow" />Kembali ke Beranda
            </Link>

            <h1 className="auth__title auth__title--first" id="auth-title" data-step style={{ "--i": 1 } as React.CSSProperties}>
              {title}
            </h1>
            <p className="lead" style={{ margin: "-16px 0 20px", textAlign: "center" }} data-step>{copy}</p>

            {children}

            <p className="auth__legal" data-step style={{ "--i": 12 } as React.CSSProperties}>
              Dengan masuk, Anda menyetujui <Link href="/terms">Syarat &amp; Ketentuan</Link> dan <Link href="/privacy">Kebijakan Privasi</Link> Serahin.
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

/** "Masuk sebagai <AuthWord>Buyer</AuthWord>" — kata beraksen hijau + garis bawah swoosh. */
export function AuthWord({ children }: { children: ReactNode }) {
  return (
    <span className="auth__word">
      <span>{children}</span>
      <svg className="auth__swoosh" viewBox="0 0 120 16" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 11C35 4 80 3 117 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
