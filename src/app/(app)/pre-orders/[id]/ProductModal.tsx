"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  ProductEditor,
  type ProductEditorValues,
} from "./products/ProductEditor";
import type { PreorderFormState } from "../actions";

type Vendor = { id: string; nama: string };

export function ProductModal({
  campaignId,
  vendors,
  action,
  initial,
  submitLabel,
  triggerLabel,
}: {
  campaignId: string;
  vendors: Vendor[];
  action: (
    prev: PreorderFormState,
    formData: FormData,
  ) => Promise<PreorderFormState>;
  initial?: ProductEditorValues;
  submitLabel: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sand-950/50 px-4 py-6 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`product-modal-${campaignId}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`product-modal-${campaignId}`}
                  className="text-xl font-extrabold text-sand-900"
                >
                  {initial ? "Edit Produk" : "Tambah Produk"}
                </h2>
                <p className="mt-1 text-sm text-sand-500">
                  Data Produk dikelola terpisah dari informasi Batch PO.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                aria-label="Tutup modal"
              >
                Tutup
              </Button>
            </div>
            <ProductEditor
              action={action}
              initial={initial}
              vendors={vendors}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      )}
    </>
  );
}
