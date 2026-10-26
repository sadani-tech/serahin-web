import type { ReactNode } from "react";
import Link from "next/link";
import { SerahinLogo } from "@/components/brand";
import { IconSprite } from "@/components/revamp/IconSprite";

/**
 * Kerangka visual bersama untuk halaman status (404, error runtime, dll) —
 * dipakai oleh not-found.tsx, error.tsx, dan global-error.tsx agar Buyer/Seller
 * tidak pernah melihat halaman error default Vercel/Next.js. Mengikuti tema
 * revamp (lihat .status-page* di revamp.css) — bukan halaman "rusak", lebih
 * ke nada netral/profesional (lihat salinan di error.tsx/global-error.tsx).
 */
export function StatusPage({
  code,
  title,
  description,
  actions,
  footnote,
}: {
  code: string;
  title: string;
  description: string;
  actions?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="rv-scope js is-loaded">
      <IconSprite />
      <div className="status-page">
        <span className="status-page__grid" aria-hidden="true" />
        <span className="status-page__glow" aria-hidden="true" />
        <div className="status-page__card">
          <Link href="/" className="status-page__brand">
            <SerahinLogo size="sm" />
          </Link>
          <p className="status-page__code">{code}</p>
          <h1 className="status-page__title">{title}</h1>
          <p className="status-page__desc">{description}</p>
          {actions && <div className="status-page__actions">{actions}</div>}
          {footnote && <div className="status-page__footnote">{footnote}</div>}
        </div>
      </div>
    </div>
  );
}
