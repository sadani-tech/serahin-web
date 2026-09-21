"use client";

import { useEffect } from "react";
import "./globals.css";
import { StatusPage } from "@/components/StatusPage";
import { LinkButton } from "@/components/ui";

/**
 * Menangkap kegagalan pada root layout itu sendiri (mis. session/provider
 * gagal init) — kasus langka, tapi tanpa file ini Next.js jatuh balik ke
 * halaman error default. Harus me-render <html>/<body> sendiri karena
 * menggantikan seluruh root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-cream-soft text-sand-900 antialiased">
        <StatusPage
          code="Oops"
          title="Aplikasi gagal dimuat"
          description="Terjadi gangguan saat memuat Serahin. Muat ulang halaman, atau coba lagi sebentar lagi."
          actions={
            <>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-brand transition-all duration-150 hover:bg-brand-700 active:translate-y-px active:bg-brand-800"
              >
                Coba lagi
              </button>
              <LinkButton href="/" variant="secondary">
                Kembali ke Beranda
              </LinkButton>
            </>
          }
          footnote={
            error.digest ? (
              <>Kode referensi: <span className="font-mono">{error.digest}</span></>
            ) : (
              "Serahin — Pesan hari ini, terima dengan hati."
            )
          }
        />
      </body>
    </html>
  );
}
