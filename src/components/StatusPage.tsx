import type { ReactNode } from "react";
import { SerahinLogo } from "@/components/brand";

/**
 * Kerangka visual bersama untuk halaman status (404, error runtime, dll) —
 * dipakai oleh not-found.tsx, error.tsx, dan global-error.tsx agar Buyer/Seller
 * tidak pernah melihat halaman error default Vercel/Next.js.
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream-soft px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sun-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-xl shadow-sand-900/5 sm:p-10">
        <div className="flex justify-center">
          <SerahinLogo size="sm" href="/" />
        </div>
        <p className="mt-8 text-6xl font-black leading-none tracking-tight text-brand-600 sm:text-7xl">
          {code}
        </p>
        <h1 className="mt-4 text-xl font-extrabold text-sand-900 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-sand-600">
          {description}
        </p>
        {actions && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {actions}
          </div>
        )}
        {footnote && <div className="mt-6 text-xs text-sand-400">{footnote}</div>}
      </div>
    </div>
  );
}
