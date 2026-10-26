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
import { CurrencyInput } from "@/components/CurrencyInput";
import { VariantColorsInput } from "@/components/VariantColorsInput";
import { VariantImagesInput } from "@/components/VariantImagesInput";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import type { PreorderFormState } from "../../actions";

export type ProductEditorValues = {
  namaVarian?: string;
  harga?: string | number;
  hpp?: string | number | null;
  kuotaMaks?: number;
  vendorId?: string | null;
  kategori?: string | null;
  label?: string | null;
  ukuran?: string | null;
  material?: string | null;
  sku?: string | null;
  deskripsi?: string | null;
  images?: string[];
  warna?: string[];
  dpTipe?: "PERSEN" | "NOMINAL" | null;
  dpPercent?: number | null;
  dpNominal?: string | number | null;
};

/** DP Batch PO — ditampilkan sebagai referensi "ikuti Batch PO" pada form Produk. */
export type CampaignDpDefault = {
  paymentScheme?: "DP_PELUNASAN" | "LUNAS";
  dpTipe?: "PERSEN" | "NOMINAL" | null;
  dpPercent?: number | null;
  dpNominal?: string | number | null;
};

type Vendor = { id: string; nama: string };

function formatDpDefaultLabel(campaignDp?: CampaignDpDefault): string {
  if (!campaignDp || campaignDp.paymentScheme !== "DP_PELUNASAN")
    return "Batch PO ini memakai skema Lunas — DP kustom tidak berlaku.";
  return campaignDp.dpTipe === "NOMINAL"
    ? `Rp${Number(campaignDp.dpNominal ?? 0).toLocaleString("id-ID")} per unit`
    : `${campaignDp.dpPercent ?? 50}% dari harga per unit`;
}

export function ProductEditor({
  action,
  initial,
  vendors,
  campaignId,
  submitLabel,
  campaignDp,
}: {
  action: (
    prev: PreorderFormState,
    formData: FormData,
  ) => Promise<PreorderFormState>;
  initial?: ProductEditorValues;
  vendors: Vendor[];
  campaignId: string;
  submitLabel: string;
  campaignDp?: CampaignDpDefault;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [images, setImages] = useState(initial?.images ?? []);
  const [warna, setWarna] = useState(initial?.warna ?? []);
  const [dpKustom, setDpKustom] = useState(Boolean(initial?.dpTipe));
  const [dpTipe, setDpTipe] = useState<"PERSEN" | "NOMINAL">(
    initial?.dpTipe ?? "PERSEN",
  );
  const dpEnabled = campaignDp?.paymentScheme === "DP_PELUNASAN";
  useOverlayWhilePending(pending);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Produk/Varian" required>
            <Input
              name="namaVarian"
              defaultValue={initial?.namaVarian}
              required
              placeholder="mis. Hoodie Hitam / M"
            />
          </Field>
          <Field label="Harga (Rp)" required>
            <CurrencyInput
              name="harga"
              defaultValue={initial?.harga ?? ""}
              required
              placeholder="150.000"
            />
          </Field>
          <Field label="HPP per unit (Rp)">
            <CurrencyInput
              name="hpp"
              defaultValue={initial?.hpp ?? ""}
              placeholder="Kosongkan bila belum diketahui"
            />
            {initial?.hpp !== undefined && initial?.harga !== undefined && Number(initial.hpp) > Number(initial.harga) && (
              <p className="mt-1 text-xs font-semibold text-sun-700">HPP lebih tinggi dari harga jual. Periksa kembali margin Produk ini.</p>
            )}
          </Field>
          <Field label="Kuota" required>
            <Input
              name="kuotaMaks"
              type="number"
              min={1}
              defaultValue={initial?.kuotaMaks}
              required
            />
          </Field>
          {vendors.length > 0 && (
            <Field label="Vendor item" required={vendors.length > 1}>
              <Select
                name="vendorId"
                defaultValue={
                  initial?.vendorId ??
                  (vendors.length === 1 ? vendors[0].id : "")
                }
                required={vendors.length > 1}
              >
                {vendors.length > 1 && (
                  <option value="">— pilih vendor —</option>
                )}
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.nama}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Kategori" required>
            <Input
              name="kategori"
              defaultValue={initial?.kategori ?? ""}
              required
              list="kategori-umum"
              placeholder="mis. Tas"
            />
          </Field>
          <Field label="Label katalog">
            <Input
              name="label"
              defaultValue={initial?.label ?? ""}
              placeholder="mis. New Arrival"
            />
          </Field>
          <Field label="Ukuran">
            <Input
              name="ukuran"
              defaultValue={initial?.ukuran ?? ""}
              placeholder="mis. M atau 40 × 25 cm"
            />
          </Field>
          <Field label="Material">
            <Input
              name="material"
              defaultValue={initial?.material ?? ""}
              placeholder="mis. Kanvas"
            />
          </Field>
          <Field label="SKU produk">
            <Input
              name="sku"
              defaultValue={initial?.sku ?? ""}
              placeholder="mis. TAS-001"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Deskripsi varian">
              <Textarea
                name="deskripsi"
                defaultValue={initial?.deskripsi ?? ""}
                rows={3}
                placeholder="Detail khusus Produk/Varian"
              />
            </Field>
          </div>
          {dpEnabled && (
            <div className="sm:col-span-2 rounded-xl border border-sand-200 bg-sand-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-sand-800">
                <input
                  type="checkbox"
                  checked={dpKustom}
                  onChange={(e) => setDpKustom(e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
                DP khusus Produk ini
              </label>
              <p className="mt-1 text-xs text-sand-500">
                Kosongkan bila Produk ini mengikuti DP Batch PO ({formatDpDefaultLabel(campaignDp)}).
              </p>
              {dpKustom && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Tipe DP">
                    <Select
                      name="dpTipe"
                      value={dpTipe}
                      onChange={(e) => setDpTipe(e.target.value as "PERSEN" | "NOMINAL")}
                    >
                      <option value="PERSEN">Persen</option>
                      <option value="NOMINAL">Nominal per unit</option>
                    </Select>
                  </Field>
                  {dpTipe === "NOMINAL" ? (
                    <Field label="DP Nominal (Rp)">
                      <CurrencyInput
                        name="dpNominal"
                        defaultValue={initial?.dpNominal ?? ""}
                        placeholder="mis. 50.000"
                      />
                    </Field>
                  ) : (
                    <Field label="DP Persen (%)">
                      <Input
                        name="dpPercent"
                        type="number"
                        min={1}
                        max={100}
                        defaultValue={initial?.dpPercent ?? ""}
                        placeholder="mis. 70"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="sm:col-span-2">
            <VariantImagesInput value={images} onChange={setImages} campaignId={campaignId} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Opsi warna">
              <VariantColorsInput value={warna} onChange={setWarna} />
            </Field>
          </div>
        </div>
        <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />
        <input type="hidden" name="warnaJson" value={JSON.stringify(warna)} />
        <datalist id="kategori-umum">
          <option value="Sepatu" />
          <option value="Tas" />
          <option value="Baju" />
          <option value="Elektronik" />
          <option value="Others" />
        </datalist>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
