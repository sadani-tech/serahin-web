"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Select,
} from "@/components/ui";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { CampaignFormState } from "./actions";

type VariantRow = {
  id?: string;
  namaVarian: string;
  kuotaMaks: number | string;
  harga: number | string;
  gambarUrl?: string;
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
  dpPercent?: number | string;
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
  const [scheme, setScheme] = useState(initial?.paymentScheme ?? "DP_PELUNASAN");
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? "");
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants && initial.variants.length > 0
      ? initial.variants
      : [{ namaVarian: "", kuotaMaks: "", harga: "" }],
  );

  const addVariant = () =>
    setVariants((v) => [...v, { namaVarian: "", kuotaMaks: "", harga: "" }]);
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
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <input type="hidden" name="variantId" value={v.id ?? ""} />
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-40 flex-1">
                  <Field label={i === 0 ? "Nama varian" : ""}>
                    <Input
                      name="variantNama"
                      value={v.namaVarian}
                      onChange={(e) =>
                        updateVariant(i, { namaVarian: e.target.value })
                      }
                      placeholder="mis. Ukuran M / Hitam"
                    />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label={i === 0 ? "Harga (Rp)" : ""}>
                    <Input
                      name="variantHarga"
                      type="number"
                      min={0}
                      step={1000}
                      value={v.harga}
                      onChange={(e) =>
                        updateVariant(i, {
                          harga: e.target.value,
                          perluTinjau: false,
                        })
                      }
                      placeholder="150000"
                    />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label={i === 0 ? "Kuota" : ""}>
                    <Input
                      name="variantKuota"
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
              <div className="mt-2">
                <Field label="URL gambar (opsional)">
                  <Input
                    name="variantGambar"
                    value={v.gambarUrl ?? ""}
                    onChange={(e) =>
                      updateVariant(i, { gambarUrl: e.target.value })
                    }
                    placeholder="https://… (link Google Drive/CDN)"
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
        </div>
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
