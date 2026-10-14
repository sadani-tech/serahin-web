"use client";

import { useActionState, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button, Card, Field, FormError, Input, Textarea } from "@/components/ui";
import { VariantImagesInput } from "@/components/VariantImagesInput";
import { VariantColorsInput } from "@/components/VariantColorsInput";
import type { ProdukFormState } from "./actions";

export function ProdukForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ProdukFormState, formData: FormData) => Promise<ProdukFormState>;
  initial?: {
    nama?: string;
    sku?: string;
    kategori?: string;
    ukuran?: string;
    material?: string;
    deskripsi?: string;
    images?: string[];
    warna?: string[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [images, setImages] = useState(initial?.images ?? []);
  const [warna, setWarna] = useState(initial?.warna ?? []);
  useOverlayWhilePending(pending);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nama produk" required>
              <Input name="nama" defaultValue={initial?.nama} required placeholder="mis. Black Inner Polka" />
            </Field>
          </div>
          <Field label="SKU">
            <Input name="sku" defaultValue={initial?.sku} placeholder="Kode internal (opsional)" />
          </Field>
          <Field label="Kategori">
            <Input name="kategori" defaultValue={initial?.kategori} placeholder="mis. Inner" />
          </Field>
          <Field label="Ukuran">
            <Input name="ukuran" defaultValue={initial?.ukuran} placeholder="mis. All Size" />
          </Field>
          <Field label="Material">
            <Input name="material" defaultValue={initial?.material} placeholder="mis. Katun" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Deskripsi">
              <Textarea name="deskripsi" defaultValue={initial?.deskripsi} rows={4} placeholder="Deskripsi singkat produk" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <VariantImagesInput value={images} onChange={setImages} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Opsi warna">
              <VariantColorsInput value={warna} onChange={setWarna} />
            </Field>
          </div>
        </div>
        <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />
        <input type="hidden" name="warnaJson" value={JSON.stringify(warna)} />
      </Card>
      <p className="text-xs text-sand-500">
        Harga, kuota, dan HPP diatur per Batch PO saat Produk ini ditempelkan ke sebuah Pre-Order — bukan di sini.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
