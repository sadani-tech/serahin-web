"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/StatusPage";
import { Button, LinkButton } from "@/components/ui";

/**
 * Batas error Next.js untuk seluruh aplikasi (kecuali kegagalan di root
 * layout — lihat global-error.tsx). Menangkap error runtime frontend maupun
 * error yang dilempar ulang dari panggilan backend (mis. ApiError non-404)
 * agar Buyer/Seller tidak pernah melihat halaman error default Vercel.
 */
export default function GlobalErrorBoundary({
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
    <StatusPage
      code="Sebentar"
      title="Halaman ini sedang kami siapkan ulang"
      description="Muat ulang halaman ini untuk melanjutkan. Kalau masih belum bisa diakses, tim support Serahin siap membantu."
      actions={
        <>
          <Button onClick={reset}>Muat Ulang</Button>
          <LinkButton href="/contact" variant="secondary">
            Hubungi Kami
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
  );
}
