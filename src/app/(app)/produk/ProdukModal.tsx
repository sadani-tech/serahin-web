"use client";

import { useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { ProdukForm } from "./ProdukForm";
import { createProduk, updateProduk } from "./actions";

type ProdukInitial = {
  nama?: string;
  sku?: string;
  kategori?: string;
  ukuran?: string;
  material?: string;
  deskripsi?: string;
  images?: string[];
  warna?: string[];
};

export function ProdukModal({
  produkId,
  initial,
  triggerLabel = "+ Produk Baru",
}: {
  /** Diisi untuk mode edit — tanpa ini, modal membuat Produk baru. */
  produkId?: string;
  initial?: ProdukInitial;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const action = produkId ? updateProduk.bind(null, produkId) : createProduk;

  return (
    <>
      {initial ? (
        <IconButton onClick={() => setOpen(true)} title="Edit Produk">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>
        </IconButton>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sand-950/50 px-4 py-6 backdrop-blur-sm sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="produk-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="produk-modal-title" className="text-xl font-extrabold text-sand-900">
                  {initial ? "Edit Produk" : "Produk Baru"}
                </h2>
                <p className="mt-1 text-sm text-sand-500">
                  Tersimpan di Katalog Produk — bisa ditempelkan ke Pre-Order manapun setelah ini.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} aria-label="Tutup modal">
                Tutup
              </Button>
            </div>
            <ProdukForm action={action} initial={initial} submitLabel={initial ? "Simpan Perubahan" : "Simpan Produk"} />
          </div>
        </div>
      )}
    </>
  );
}
