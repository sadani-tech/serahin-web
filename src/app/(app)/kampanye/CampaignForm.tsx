"use client";

import { useActionState, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
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
import { VariantImagesInput } from "@/components/VariantImagesInput";
import { VariantColorsInput } from "@/components/VariantColorsInput";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import { formatRupiah } from "@/lib/format";
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
  kategori: string;
  label: string;
  ukuran: string;
  material: string;
  sku: string;
  deskripsi: string;
  vendorId: string;
  perluTinjau?: boolean; // harga hasil migrasi (OQ3)
  terisi?: number; // untuk info di mode edit
  expanded?: boolean; // UI-only: expand/collapse, tidak dikirim ke server
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
  deskripsiPelunasan?: string;
  linkCheckoutShopee?: string;
  tanggalBuka?: string;
  tanggalTutup?: string;
  estimasiProduksi?: string;
  estimasiKirim?: string;
  paymentScheme?: "DP_PELUNASAN" | "LUNAS";
  dpTipe?: DpTipe;
  dpPercent?: number | string;
  dpNominal?: number | string;
  deadlinePelunasan?: string;
  vendorIds?: string[];
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
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    initial?.vendorIds ?? [],
  );
  const selectedVendors = vendors.filter((vendor) =>
    selectedVendorIds.includes(vendor.id),
  );
  const emptyVariant = (): VariantRow => ({
    namaVarian: "",
    kuotaMaks: "",
    harga: "",
    images: [],
    warna: [],
    kategori: "",
    label: "",
    ukuran: "",
    material: "",
    sku: "",
    deskripsi: "",
    vendorId: selectedVendorIds.length === 1 ? selectedVendorIds[0] : "",
    expanded: true,
  });
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants && initial.variants.length > 0
      ? initial.variants.map((row) => ({
          ...row,
          expanded: row.namaVarian.trim().length === 0,
        }))
      : [emptyVariant()],
  );

  const addVariant = () => setVariants((v) => [...v, emptyVariant()]);
  const removeVariant = (i: number) =>
    setVariants((v) => (v.length > 1 ? v.filter((_, idx) => idx !== i) : v));
  const updateVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const toggleVendor = (vendorId: string) => {
    const selected = selectedVendorIds.includes(vendorId);
    const nextVendorIds = selected
      ? selectedVendorIds.filter((id) => id !== vendorId)
      : [...selectedVendorIds, vendorId];
    setSelectedVendorIds(nextVendorIds);
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        vendorId: selected
          ? variant.vendorId === vendorId
            ? nextVendorIds.length === 1
              ? nextVendorIds[0]
              : ""
            : variant.vendorId
          : selectedVendorIds.length === 0 && !variant.vendorId
            ? vendorId
            : variant.vendorId,
      })),
    );
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-sand-900">
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
        <p className="mt-3 text-xs text-sand-500">
          Sejak v1.5, harga ditetapkan per varian (lihat bagian Varian & Kuota),
          bukan satu harga untuk seluruh kampanye.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-sand-900">
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
        <h3 className="mb-4 text-sm font-semibold text-sand-900">
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
        {scheme === "DP_PELUNASAN" && (
          <div className="mt-4">
            <Field
              label="Instruksi pelunasan (v1.8)"
              hint="Tampil di portal pembeli saat status DP Diterima. Sertakan opsi pengiriman, link checkout Shopee, dan nomor rekening TF."
            >
              <RichTextEditor
                name="deskripsiPelunasan"
                defaultValue={initial?.deskripsiPelunasan ?? ""}
                placeholder="Halo! Tas kamu sudah bisa dilunasi. Ada dua opsi pengiriman…"
              />
            </Field>
            <div className="mt-4">
              <Field
                label="Link Checkout Shopee"
                hint="Ditampilkan di portal saat pembeli memilih opsi Checkout Shopee."
              >
                <Input
                  name="linkCheckoutShopee"
                  type="url"
                  defaultValue={initial?.linkCheckoutShopee}
                  placeholder="https://shopee.co.id/..."
                />
              </Field>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-sand-900">Vendor</h3>
        <p className="mb-3 text-xs text-sand-500">
          Pilih satu atau lebih vendor. Vendor per item ditentukan pada bagian varian.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {vendors.map((vendor) => {
            const selected = selectedVendorIds.includes(vendor.id);
            return (
              <label
                key={vendor.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                  selected ? "border-brand-500 bg-brand-50" : "border-sand-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="vendorIds"
                  value={vendor.id}
                  checked={selected}
                  onChange={() => toggleVendor(vendor.id)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-sand-900">{vendor.nama}</span>
                  <span className="mt-0.5 block text-xs text-sand-500">
                    Rating {vendor.avgRating ?? "—"} · {vendor.jumlahKampanye} kampanye · {vendor.jumlahTelat}× telat
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {vendors.length === 0 && (
          <p className="text-sm text-sand-500">Belum ada vendor tersimpan.</p>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-sand-900">
            Varian & Kuota
          </h3>
        </div>
        {/* Varian dikirim sebagai satu field JSON (mendukung images/warna bersarang). */}
        <input
          type="hidden"
          name="variantsJson"
          value={JSON.stringify(
            variants.map(({ expanded: _expanded, ...row }) => row),
          )}
        />
        <datalist id="kategori-umum">
          <option value="Sepatu" />
          <option value="Tas" />
          <option value="Baju" />
          <option value="Elektronik" />
          <option value="Others" />
        </datalist>
        <div className="space-y-3">
          {variants.map((v, i) => {
            const isFilled = v.namaVarian.trim().length > 0;
            const isExpanded = v.expanded !== false;
            return (
              <div key={i} className="rounded-lg border border-sand-200 p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateVariant(i, { expanded: !isExpanded })}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={isExpanded}
                  >
                    <span
                      className={`shrink-0 text-sand-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className="truncate text-sm font-semibold text-sand-900">
                      {isFilled ? v.namaVarian : `Varian ${i + 1} (belum diisi)`}
                    </span>
                    {!isExpanded && isFilled && (
                      <span className="truncate text-xs font-normal text-sand-500">
                        {v.kategori && `${v.kategori} · `}
                        {v.harga ? `${formatRupiah(v.harga)} · ` : ""}
                        Kuota {v.kuotaMaks || 0}
                      </span>
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeVariant(i)}
                    className="shrink-0 text-rose-600"
                    disabled={variants.length === 1}
                    title="Hapus varian"
                  >
                    Hapus
                  </Button>
                </div>
                {isExpanded && (
                  <>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="min-w-40 flex-1">
                        <Field label="Nama varian">
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
                        <Field label="Harga (Rp)">
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
                        <Field label="Kuota">
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
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {selectedVendors.length > 0 && (
                        <Field label="Vendor item" required>
                          <Select
                            value={v.vendorId}
                            onChange={(e) => updateVariant(i, { vendorId: e.target.value })}
                            required
                          >
                            <option value="">— pilih vendor —</option>
                            {selectedVendors.map((vendor) => (
                              <option key={vendor.id} value={vendor.id}>{vendor.nama}</option>
                            ))}
                          </Select>
                        </Field>
                      )}
                      <Field label="Kategori" required>
                        <Input
                          value={v.kategori}
                          onChange={(e) => updateVariant(i, { kategori: e.target.value })}
                          list="kategori-umum"
                          placeholder="mis. Tas"
                          required
                        />
                      </Field>
                      <Field label="Label katalog (opsional)">
                        <Input
                          value={v.label}
                          onChange={(e) => updateVariant(i, { label: e.target.value })}
                          placeholder="mis. New Arrival"
                        />
                      </Field>
                      <Field label="Ukuran (opsional)">
                        <Input
                          value={v.ukuran}
                          onChange={(e) => updateVariant(i, { ukuran: e.target.value })}
                          placeholder="mis. M atau 40 × 25 cm"
                        />
                      </Field>
                      <Field label="Material (opsional)">
                        <Input
                          value={v.material}
                          onChange={(e) => updateVariant(i, { material: e.target.value })}
                          placeholder="mis. Kanvas"
                        />
                      </Field>
                      <Field label="SKU produk (opsional)">
                        <Input
                          value={v.sku}
                          onChange={(e) => updateVariant(i, { sku: e.target.value })}
                          placeholder="mis. TAS-001"
                        />
                      </Field>
                      <Field label="Deskripsi varian (opsional)">
                        <Textarea
                          value={v.deskripsi}
                          onChange={(e) => updateVariant(i, { deskripsi: e.target.value })}
                          placeholder="Detail khusus varian ini"
                          rows={2}
                        />
                      </Field>
                      <VariantImagesInput
                        value={v.images}
                        onChange={(images) => updateVariant(i, { images })}
                      />
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
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={addVariant}>
            + Tambah varian
          </Button>
        </div>
        {variants.some((v) => v.terisi && v.terisi > 0) && (
          <p className="mt-3 text-xs text-sand-500">
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
