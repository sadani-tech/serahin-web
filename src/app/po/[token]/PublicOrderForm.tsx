"use client";

import { useActionState, useState } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { createPublicOrder } from "../actions";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "../constants";

export type PublicVariantOption = {
  id: string;
  namaVarian: string;
  sisa: number;
  harga: number;
  gambarUrl?: string | null;
};

export function PublicOrderForm({
  formToken,
  variants,
}: {
  formToken: string;
  variants: PublicVariantOption[];
}) {
  const action = createPublicOrder.bind(null, formToken);
  const [state, formAction, pending] = useActionState<
    PublicOrderState,
    FormData
  >(action, undefined);

  // Keranjang: qty per varian (0 = tidak dipesan).
  const [qty, setQty] = useState<Record<string, number>>({});
  const setQ = (id: string, v: number) =>
    setQty((s) => ({ ...s, [id]: Math.max(0, v) }));

  const total = variants.reduce(
    (s, v) => s + v.harga * (qty[v.id] ?? 0),
    0,
  );
  const adaItem = variants.some((v) => (qty[v.id] ?? 0) > 0);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <FormError message={state.error} />}
      {state?.needsConfirm && state.warning && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          {state.warning}
        </div>
      )}
      {state?.needsConfirm && (
        <input type="hidden" name="confirmDuplikat" value="1" />
      )}

      <Field label="Nama" required>
        <Input name="namaPembeli" required placeholder="Nama lengkap Anda" />
      </Field>
      <Field label="WhatsApp" required>
        <Input name="wa" required placeholder="081234567890" />
      </Field>
      <Field label="Email" required>
        <Input name="email" type="email" required placeholder="email@example.com" />
      </Field>

      {/* Keranjang varian (FR-3.1/3.1a) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Pilih varian</p>
        {variants.map((v) => {
          const habis = v.sisa <= 0;
          const q = qty[v.id] ?? 0;
          return (
            <div
              key={v.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                habis ? "border-slate-100 opacity-60" : "border-slate-200"
              }`}
            >
              {v.gambarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.gambarUrl}
                  alt={v.namaVarian}
                  className="h-12 w-12 rounded object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {v.namaVarian}
                </p>
                <p className="text-xs text-slate-500">
                  {formatRupiah(v.harga)} · sisa {Math.max(0, v.sisa)}
                </p>
              </div>
              {habis ? (
                <span className="text-xs font-medium text-rose-600">Habis</span>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQ(v.id, q - 1)}
                    className="h-7 w-7 rounded bg-slate-100 text-slate-700"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{q}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQ(v.id, Math.min(v.sisa, MAX_UNIT_PER_SUBMISSION, q + 1))
                    }
                    className="h-7 w-7 rounded bg-slate-100 text-slate-700"
                  >
                    +
                  </button>
                </div>
              )}
              {q > 0 && (
                <>
                  <input type="hidden" name="itemVariantId" value={v.id} />
                  <input type="hidden" name="itemJumlah" value={q} />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-lg font-semibold text-slate-900">
          {formatRupiah(total)}
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={pending || !adaItem}>
        {pending
          ? "Mengirim…"
          : state?.needsConfirm
            ? "Ya, kirim tetap"
            : "Kirim Pesanan"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Maksimal {MAX_UNIT_PER_SUBMISSION} unit per varian.
      </p>
    </form>
  );
}
