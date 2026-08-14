"use client";

import { useActionState, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  ScrollList,
  Select,
} from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { VariantImagesInput } from "@/components/VariantImagesInput";
import { VariantColorsInput } from "@/components/VariantColorsInput";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { DpTipe } from "@/lib/types";
import type { CampaignFormState } from "./actions";

type VariantRow = {
  id?: string;
  namaVarian: string;
  kuotaMaks: number | string;
  harga: number | string;
  images: string[]; // galeri gambar (URL); [0] = utama
  warna: string[]; // opsi warna
  perluTinjau?: boolean; // harga hasil migrasi (OQ3)
  terisi?: number; // untuk info di mode edit
};

export type VendorOption = {
  id: string;
  nama: string;
  avgRating: number | null;
  jumlahTelat: number;
  jumlahKampanye: number;
};

export type CampaignFormValues = {
  namaProduk?: string;
  deskripsi?: string;
  tanggalBuka?: string;
  tanggalTutup?: string;
  estimasiProduksi?: string;
  estimasiKirim?: string;
  paymentScheme?: "DP_PELUNASAN" | "LUNAS";
  dpTipe?: DpTipe;
  dpPercent?: number | string;
  dpNominal?: number | string;
  deadlinePelunasan?: string;
  vendorId?: string;
  variants?: VariantRow[];
};

export function CampaignForm({
  action,
  initial,
  submitLabel,
  vendors = [],
}: {
  action: (
    prev: CampaignFormState,
    formData: FormData,
  ) => Promise<CampaignFormState>;
  initial?: CampaignFormValues;
  submitLabel: string;
  vendors?: VendorOption[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  useOverlayWhilePending(pending);
  const [scheme, setScheme] = useState(initial?.paymentScheme ?? "DP_PELUNASAN");
  const [dpTipe, setDpTipe] = useState<DpTipe>(initial?.dpTipe ?? "PERSEN");
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? "");
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const emptyVariant = (): VariantRow => ({
    namaVarian: "",
    kuotaMaks: "",
    harga: "",
    images: [],
    warna: [],
  });
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants && initial.variants.length > 0
      ? initial.variants
      : [emptyVariant()],
  );

  const addVariant = () => setVariants((v) => [...v, emptyVariant()]);
  const removeVariant = (i: number) =>
    setVariants((v) => (v.length > 1 ? v.filter((_, idx) => idx !== i) : v));
  const updateVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Detail Produk
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nama produk" required>
              <Input
                name="namaProduk"
                defaultValue={initial?.namaProduk}
                placeholder="mis. Kaos Komunitas Batch 1"
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Deskripsi"
              hint="Tampil di formulir PO publik dengan format teks kaya."
            >
              <RichTextEditor
                name="deskripsi"
                defaultValue={initial?.deskripsi ?? ""}
                placeholder="Bahan, spesifikasi, catatan penting…"
              />
            </Field>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Sejak v1.5, harga ditetapkan per varian (lihat bagian Varian & Kuota),
          bukan satu harga untuk seluruh kampanye.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Jadwal PO
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal buka PO" required>
            <Input
              name="tanggalBuka"
              type="date"
              defaultValue={initial?.tanggalBuka}
              required
            />
          </Field>
          <Field label="Tanggal tutup PO (deadline)" required>
            <Input
              name="tanggalTutup"
              type="date"
              defaultValue={initial?.tanggalTutup}
              required
            />
          </Field>
          <Field label="Estimasi produksi selesai">
            <Input
              name="estimasiProduksi"
              type="date"
              defaultValue={initial?.estimasiProduksi}
            />
          </Field>
          <Field label="Estimasi kirim">
            <Input
              name="estimasiKirim"
              type="date"
              defaultValue={initial?.estimasiKirim}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Skema Pembayaran
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Skema" required>
            <Select
              name="paymentScheme"
              value={scheme}
              onChange={(e) =>
                setScheme(e.target.value as "DP_PELUNASAN" | "LUNAS")
              }
            >
              {Object.entries(PAYMENT_SCHEME_LABEL).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {scheme === "DP_PELUNASAN" && (
            <Field label="Tipe DP" hint="Persentase dari total, atau nominal tetap.">
              <Select
                name="dpTipe"
                value={dpTipe}
                onChange={(e) => setDpTipe(e.target.value as DpTipe)}
              >
                <option value="PERSEN">Persentase (%)</option>
                <option value="NOMINAL">Nominal tetap (Rp)</option>
              </Select>
            </Field>
          )}
          {scheme === "DP_PELUNASAN" && dpTipe === "PERSEN" && (
            <Field label="Persentase DP (%)" hint="Contoh: 50 untuk DP 50%">
              <Input
                name="dpPercent"
                type="number"
                min={1}
                max={99}
                defaultValue={initial?.dpPercent ?? 50}
              />
            </Field>
          )}
          {scheme === "DP_PELUNASAN" && dpTipe === "NOMINAL" && (
            <Field label="Nominal DP (Rp)" required hint="DP tetap per pesanan, mis. 100.000">
              <CurrencyInput
                name="dpNominal"
                defaultValue={initial?.dpNominal ?? ""}
                placeholder="100.000"
                required
              />
            </Field>
          )}
          <Field
            label="Deadline pelunasan"
            hint="Pesanan yang mendekati/melewati deadline akan disorot."
          >
            <Input
              name="deadlinePelunasan"
              type="date"
              defaultValue={initial?.deadlinePelunasan}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Vendor</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor pelaksana" hint="Opsional — pilih dari vendor tersimpan.">
            <Select
              name="vendorId"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              <option value="">— tanpa vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nama}
                </option>
              ))}
            </Select>
          </Field>
          {selectedVendor && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Riwayat vendor (FR-7.5)
              </p>
              <p className="mt-1 text-slate-700">
                Rating rata-rata:{" "}
                <span className="font-medium text-amber-600">
                  {selectedVendor.avgRating ?? "—"}
                </span>{" "}
                · {selectedVendor.jumlahKampanye} kampanye ·{" "}
                <span
                  className={
                    selectedVendor.jumlahTelat > 0
                      ? "font-medium text-rose-600"
                      : ""
                  }
                >
                  {selectedVendor.jumlahTelat}× telat
                </span>
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Varian & Kuota
          </h3>
          <Button type="button" variant="secondary" onClick={addVariant}>
            + Tambah varian
          </Button>
        </div>
        {/* Varian dikirim sebagai satu field JSON (mendukung images/warna bersarang). */}
        <input
          type="hidden"
          name="variantsJson"
          value={JSON.stringify(variants)}
        />
        <ScrollList maxRows={10} rowHeight={3.5} className="space-y-3 pr-1">
          {variants.map((v, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-40 flex-1">
                  <Field label={i === 0 ? "Nama varian" : ""}>
                    <Input
                      value={v.namaVarian}
                      onChange={(e) =>
                        updateVariant(i, { namaVarian: e.target.value })
                      }
                      placeholder="mis. Sepatu Keren"
                    />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label={i === 0 ? "Harga (Rp)" : ""}>
                    <CurrencyInput
                      value={v.harga}
                      onValueChange={(raw) =>
                        updateVariant(i, {
                          harga: raw,
                          perluTinjau: false,
                        })
                      }
                      placeholder="150.000"
                    />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label={i === 0 ? "Kuota" : ""}>
                    <Input
                      type="number"
                      min={v.terisi ?? 1}
                      value={v.kuotaMaks}
                      onChange={(e) =>
                        updateVariant(i, { kuotaMaks: e.target.value })
                      }
                      placeholder="20"
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeVariant(i)}
                  className="mb-0.5 text-rose-600"
                  disabled={variants.length === 1}
                  title="Hapus varian"
                >
                  Hapus
                </Button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Gambar varian (galeri, opsional)">
                  <VariantImagesInput
                    value={v.images}
                    onChange={(images) => updateVariant(i, { images })}
                  />
                </Field>
                <Field label="Opsi warna (opsional)">
                  <VariantColorsInput
                    value={v.warna}
                    onChange={(warna) => updateVariant(i, { warna })}
                  />
                </Field>
              </div>
              {v.perluTinjau && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠ Harga hasil migrasi — mohon ditinjau/disesuaikan bila perlu.
                </p>
              )}
            </div>
          ))}
        </ScrollList>
        {variants.some((v) => v.terisi && v.terisi > 0) && (
          <p className="mt-3 text-xs text-slate-500">
            Kuota tidak dapat diturunkan di bawah jumlah pesanan yang sudah
            terisi. Varian yang sudah punya pesanan tidak bisa dihapus.
          </p>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
