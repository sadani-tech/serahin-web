"use client";

import { useState } from "react";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";

/**
 * Tombol "Lihat bukti" pada alur verifikasi pembayaran — sebelumnya buka
 * tab baru (`target="_blank"`), sekarang tampil langsung sebagai modal di
 * halaman yang sama. Gambar (JPG/PNG/WEBP) dipratinjau lewat
 * `ImagePreviewModal`; PDF (bukti juga boleh PDF, lihat `FileUploadField`)
 * ditampilkan lewat `<iframe>` di modal terpisah karena tidak bisa direndar
 * sebagai `<img>`.
 */
export function ProofViewerButton({
  url,
  label = "Lihat bukti",
  title = "Bukti pembayaran",
  className,
}: {
  url: string;
  label?: string;
  title?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const isPdf = /\.pdf(\?|$)/i.test(url);

  if (isPdf) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {label}
        </button>
        {open && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-sand-900/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="relative flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sand-200">
              <div className="flex items-center justify-between border-b border-sand-100 px-4 py-3">
                <h3 className="truncate text-sm font-semibold text-sand-900">{title} (PDF)</h3>
                <div className="flex items-center gap-3">
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-700 hover:underline">
                    Buka di tab baru
                  </a>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <iframe src={url} title={title} className="flex-1 bg-sand-50" />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <ImagePreviewModal images={[url]} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}
