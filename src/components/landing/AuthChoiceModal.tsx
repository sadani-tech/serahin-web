"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowIcon, Icon } from "@/components/landing/icons";

export function AuthChoiceModal({ mobile = false, light = false }: { mobile?: boolean; light?: boolean }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={mobile ? "button button--primary auth-choice-trigger--mobile" : light ? "button button--light" : "button button--small button--ghost desktop-login"}
        onClick={() => setOpen(true)}
      >
        {light ? "Masuk ke Serahin" : "Masuk"} <ArrowIcon />
      </button>

      {open && createPortal((
        <div className="auth-choice-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="auth-choice-modal"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="auth-choice-close" type="button" aria-label="Tutup pilihan masuk" onClick={() => setOpen(false)}>×</button>
            <span className="eyebrow">Pilih ruang Anda</span>
            <h2 id={titleId}>Masuk ke Serahin</h2>
            <p>Pilih akses sesuai kebutuhan Anda untuk melanjutkan ke ruang Buyer atau Seller.</p>
            <div className="auth-choice-grid">
              <Link href="/account/login" className="auth-choice-card auth-choice-card--buyer" onClick={() => setOpen(false)}>
                <span className="auth-choice-icon"><Icon name="seller" /></span>
                <span><small>UNTUK PEMBELI</small><strong>Masuk sebagai Buyer</strong><em>Belanja, bayar, dan pantau seluruh pesanan.</em></span>
                <ArrowIcon />
              </Link>
              <Link href="/seller/login" className="auth-choice-card auth-choice-card--seller" onClick={() => setOpen(false)}>
                <span className="auth-choice-icon"><Icon name="catalog" /></span>
                <span><small>UNTUK PENJUAL</small><strong>Masuk sebagai Seller</strong><em>Kelola Batch PO, pembayaran, dan progres.</em></span>
                <ArrowIcon />
              </Link>
            </div>
            <p className="auth-choice-note">Belum menjadi Seller? <Link href="/seller" onClick={() => setOpen(false)}>Ajukan aplikasi Seller</Link></p>
          </section>
        </div>
      ), document.body)}
    </>
  );
}
