"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { OrderFormState } from "./actions";

export type VariantOption = {
  id: string;
  namaVarian: string;
  sisa: number; // sisa kuota
  harga: number;
};

type Row = { variantId: string; jumlah: number };

export function OrderForm({
  action,
  variants,
  initial,
  submitLabel,
}: {
  action: (
    prev: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  variants: VariantOption[];
  initial?: {
    namaPembeli?: string;
    kontak?: string;
    catatan?: string;
    items?: Row[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [rows, setRows] = useState<Row[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ variantId: "", jumlah: 1 }],
  );

  const varById = new Map(variants.map((v) => [v.id, v]));
  const addRow = () => setRows((r) => [...r, { variantId: "", jumlah: 1 }]);
  const removeRow = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));
  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const total = rows.reduce((s, r) => {
    const v = varById.get(r.variantId);
    return s + (v ? v.harga * r.jumlah : 0);
  }, 0);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama pembeli" required>
            <Input
              name="namaPembeli"
              defaultValue={initial?.namaPembeli}
              placeholder="Nama lengkap"
              required
            />
          </Field>
          <Field label="Kontak (WA / email)" required>
            <Input
              name="kontak"
              defaultValue={initial?.kontak}
              placeholder="081234567890"
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan">
              <Textarea
                name="catatan"
                rows={2}
                defaultValue={initial?.catatan}
                placeholder="Catatan tambahan (opsional)"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Item pesanan (keranjang)
          </h3>
          <Button type="button" variant="secondary" onClick={addRow}>
            + Tambah item
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((r, i) => {
            const v = varById.get(r.variantId);
            return (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1">
                  <Field label={i === 0 ? "Varian" : ""}>
                    <Select
                      name="itemVariantId"
                      value={r.variantId}
                      onChange={(e) => update(i, { variantId: e.target.value })}
                    >
                      <option value="">— pilih varian —</option>
                      {variants.map((opt) => (
                        <option
                          key={opt.id}
                          value={opt.id}
                          disabled={
                            opt.sisa <= 0 && opt.id !== r.variantId
                          }
                        >
                          {opt.namaVarian} — {formatRupiah(opt.harga)} (sisa{" "}
                          {opt.sisa})
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="w-24">
                  <Field label={i === 0 ? "Jumlah" : ""}>
                    <Input
                      name="itemJumlah"
                      type="number"
                      min={1}
                      value={r.jumlah}
                      onChange={(e) =>
                        update(i, { jumlah: Number(e.target.value) || 1 })
                      }
                    />
                  </Field>
                </div>
                <div className="w-28 pb-2 text-right text-sm text-slate-600">
                  {v ? formatRupiah(v.harga * r.jumlah) : "—"}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeRow(i)}
                  className="mb-0.5 text-rose-600"
                  disabled={rows.length === 1}
                >
                  Hapus
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 text-sm">
          <span className="font-medium text-slate-900">
            Total: {formatRupiah(total)}
          </span>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
