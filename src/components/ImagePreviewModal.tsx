"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";

/**
 * Lightbox pratinjau gambar varian. Menampilkan satu gambar besar dengan
 * navigasi prev/next (bila lebih dari satu), strip thumbnail, dan tutup via
 * tombol / Esc / klik backdrop. Panah kiri-kanan untuk navigasi keyboard.
 */
export function ImagePreviewModal({
  images,
  startIndex = 0,
  title,
  onClose,
}: {
  images: string[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  const count = images.length;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setI((x) => (x - 1 + count) % count);
      else if (e.key === "ArrowRight") setI((x) => (x + 1) % count);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [count, onClose]);

  if (count === 0) return null;
  const idx = Math.min(i, count - 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-sand-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sand-200">
        <div className="flex items-center justify-between border-b border-sand-100 px-4 py-3">
          <h3 className="truncate text-sm font-semibold text-sand-900">
            {title ?? "Pratinjau"}
            {count > 1 && (
              <span className="ml-2 font-normal text-sand-400">
                {idx + 1}/{count}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 hover:bg-sand-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="relative flex items-center justify-center bg-sand-50">
          <ProductImage
            src={images[idx]}
            alt={title ?? "Gambar varian"}
            className="max-h-[60vh] w-full object-contain"
            iconClassName="h-16 w-16"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => setI((x) => (x - 1 + count) % count)}
                aria-label="Sebelumnya"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sand-700 shadow ring-1 ring-sand-200 hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setI((x) => (x + 1) % count)}
                aria-label="Berikutnya"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sand-700 shadow ring-1 ring-sand-200 hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-sand-100 p-3">
            {images.map((src, n) => (
              <button
                key={`${src}-${n}`}
                type="button"
                onClick={() => setI(n)}
                className={`shrink-0 overflow-hidden rounded-lg ring-2 ${
                  n === idx ? "ring-brand-500" : "ring-transparent"
                }`}
                aria-label={`Gambar ${n + 1}`}
              >
                <ProductImage
                  src={src}
                  alt={`Gambar ${n + 1}`}
                  className="h-12 w-12 object-cover"
                  iconClassName="h-5 w-5"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
