"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, ScrollList } from "@/components/ui";
import { formatRupiah } from "@/lib/format";

export type PickerVariant = {
  id: string;
  namaVarian: string;
  sisa: number;
  harga: number;
};

// Modal pemilih varian untuk keranjang pesanan: cari, lihat harga & sisa kuota,
// lalu tambahkan. Varian yang sudah di keranjang / habis ditandai.
export function VariantPickerModal({
  open,
  onClose,
  variants,
  inCart,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  variants: PickerVariant[];
  inCart: Set<string>;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? variants.filter((v) => v.namaVarian.toLowerCase().includes(s))
      : variants;
  }, [variants, q]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">Pilih varian</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari varian…"
          />
        </div>

        <ScrollList maxRows={8} rowHeight={4} className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Tidak ada varian yang cocok.
            </p>
          ) : (
            filtered.map((v) => {
              const habis = v.sisa <= 0;
              const added = inCart.has(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={habis && !added}
                  onClick={() => onPick(v.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {v.namaVarian}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatRupiah(v.harga)} · sisa {Math.max(0, v.sisa)}
                    </p>
                  </div>
                  {added ? (
                    <span className="shrink-0 text-xs font-medium text-emerald-600">
                      ✓ Di keranjang
                    </span>
                  ) : habis ? (
                    <span className="shrink-0 text-xs font-medium text-rose-600">
                      Habis
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                      Tambah
                    </span>
                  )}
                </button>
              );
            })
          )}
        </ScrollList>

        <div className="border-t border-slate-100 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
