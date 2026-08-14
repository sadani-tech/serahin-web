"use client";

import { useState } from "react";

// Ikon kantong belanja — dipakai sebagai fallback saat gambar varian kosong
// atau gagal dirender (URL rusak / 404).
export function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/**
 * Gambar produk/varian dengan fallback ikon kantong belanja bila `src` kosong
 * atau gagal dimuat. Opsional dapat diklik (mis. untuk membuka pratinjau).
 */
export function ProductImage({
  src,
  alt,
  className = "",
  iconClassName = "h-1/2 w-1/2",
  onClick,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const clickable = !!onClick;

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${
          clickable ? "cursor-pointer" : ""
        } ${className}`}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        aria-label={clickable ? `Pratinjau ${alt}` : undefined}
      >
        <ShoppingBagIcon className={iconClassName} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      onClick={onClick}
      className={`${clickable ? "cursor-pointer" : ""} ${className}`}
    />
  );
}
