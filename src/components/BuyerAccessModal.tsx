"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { GoogleBuyerSignIn } from "@/components/GoogleBuyerSignIn";
import { SerahinLogo } from "@/components/brand";

export function BuyerAccessModal({
  callbackUrl,
  onClose,
  switchingAccount = false,
}: {
  callbackUrl: string;
  onClose: () => void;
  switchingAccount?: boolean;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const query = `callbackUrl=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-sand-950/25 px-4 py-8 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="buyer-access-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Tutup dialog masuk" onClick={onClose} />
      <section className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 shadow-2xl">
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Kembali memilih produk" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sand-500 shadow-sm ring-1 ring-sand-200 hover:text-sand-900">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
        </button>
        <div className="bg-gradient-to-br from-sun-50 via-white to-brand-50 px-6 pb-5 pt-6 text-center sm:px-8">
          <div className="flex justify-center"><SerahinLogo size="sm" /></div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Satu langkah lagi</p>
          <h2 id="buyer-access-title" className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">Masuk untuk menyelesaikan pesanan</h2>
          <p className="mt-2 text-sm leading-6 text-sand-600">
            {switchingAccount
              ? "Sesi Seller atau Admin berbeda dari akun pembelian. Masuk sebagai Buyer agar pesanan tercatat pada akun yang tepat."
              : "Pilihan barangmu sudah tersimpan. Setelah masuk atau mendaftar, kamu kembali langsung ke checkout ini."}
          </p>
        </div>
        <div className="space-y-3 px-6 py-6 sm:px-8">
          <Link href={`/api/auth/switch?${query}`} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand transition hover:bg-brand-700">Masuk sebagai Buyer</Link>
          <Link href={`/api/auth/switch?mode=register&${query}`} className="flex min-h-12 w-full items-center justify-center rounded-xl border border-brand-300 bg-white px-4 text-sm font-extrabold text-brand-700 transition hover:bg-brand-50">Daftar akun Buyer</Link>
          <GoogleBuyerSignIn callbackUrl={callbackUrl} />
          <button type="button" onClick={onClose} className="min-h-10 w-full text-sm font-bold text-sand-500 hover:text-sand-800">Kembali memilih produk</button>
        </div>
      </section>
    </div>
  );
}
