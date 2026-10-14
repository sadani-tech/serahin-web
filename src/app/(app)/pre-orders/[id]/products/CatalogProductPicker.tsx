"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button, Card, Field, FormError, Input, Select } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { searchAvailableCatalogProducts, attachCatalogProduct } from "../../actions";
import type { CampaignDpDefault } from "./ProductEditor";

type CatalogProductOption = {
  id: string;
  nama: string;
  sku: string | null;
  kategori: string | null;
  ukuran: string | null;
  material: string | null;
  images: string[];
  warna: string[];
  deskripsi: string | null;
};

type Vendor = { id: string; nama: string };

function formatDpDefaultLabel(campaignDp?: CampaignDpDefault): string {
  if (!campaignDp || campaignDp.paymentScheme !== "DP_PELUNASAN")
    return "Batch PO ini memakai skema Lunas — DP kustom tidak berlaku.";
  return campaignDp.dpTipe === "NOMINAL"
    ? `Rp${Number(campaignDp.dpNominal ?? 0).toLocaleString("id-ID")} per unit`
    : `${campaignDp.dpPercent ?? 50}% dari harga per unit`;
}

export function CatalogProductPicker({
  campaignId,
  vendors,
  campaignDp,
}: {
  campaignId: string;
  vendors: Vendor[];
  campaignDp?: CampaignDpDefault;
}) {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<CatalogProductOption[]>([]);
  const [, startSearch] = useTransition();
  const [selected, setSelected] = useState<CatalogProductOption | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      startSearch(async () => {
        const rows = await searchAvailableCatalogProducts(campaignId, q || undefined);
        setOptions(rows);
        setLoaded(true);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [campaignId, q]);

  if (selected) {
    return (
      <AttachForm
        campaignId={campaignId}
        produk={selected}
        vendors={vendors}
        campaignDp={campaignDp}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Input
        autoFocus
        placeholder="Cari nama, SKU, atau kategori Produk…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-80 overflow-y-auto rounded-xl border border-sand-200">
        {loaded && options.length === 0 ? (
          <p className="p-5 text-center text-sm text-sand-500">
            {q
              ? "Tidak ada Produk Katalog yang cocok."
              : "Belum ada Produk di Katalog Produk — buat dulu lewat menu Produk."}
          </p>
        ) : (
          <ul className="divide-y divide-sand-100">
            {options.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sand-50"
                >
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-10 w-10 shrink-0 rounded-lg bg-sand-100" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-sand-900">{p.nama}</span>
                    <span className="block truncate text-xs text-sand-500">
                      {[p.kategori, p.sku ? `SKU ${p.sku}` : null].filter(Boolean).join(" · ") || "-"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AttachForm({
  campaignId,
  produk,
  vendors,
  campaignDp,
  onBack,
}: {
  campaignId: string;
  produk: CatalogProductOption;
  vendors: Vendor[];
  campaignDp?: CampaignDpDefault;
  onBack: () => void;
}) {
  const action = attachCatalogProduct.bind(null, campaignId, produk.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [dpKustom, setDpKustom] = useState(false);
  const [dpTipe, setDpTipe] = useState<"PERSEN" | "NOMINAL">("PERSEN");
  const dpEnabled = campaignDp?.paymentScheme === "DP_PELUNASAN";
  useOverlayWhilePending(pending);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-sand-50 p-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-sand-900">{produk.nama}</p>
            <p className="truncate text-xs text-sand-500">
              {[produk.kategori, produk.sku ? `SKU ${produk.sku}` : null].filter(Boolean).join(" · ") || "Dari Produk Center"}
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onBack}>
            Ganti
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Harga (Rp)" required>
            <CurrencyInput name="harga" required placeholder="150.000" />
          </Field>
          <Field label="HPP per unit (Rp)">
            <CurrencyInput name="hpp" placeholder="Kosongkan bila belum diketahui" />
          </Field>
          <Field label="Kuota" required>
            <Input name="kuotaMaks" type="number" min={1} required />
          </Field>
          {vendors.length > 0 && (
            <Field label="Vendor item" required={vendors.length > 1}>
              <Select name="vendorId" defaultValue={vendors.length === 1 ? vendors[0].id : ""} required={vendors.length > 1}>
                {vendors.length > 1 && <option value="">— pilih vendor —</option>}
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.nama}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Label katalog">
            <Input name="label" placeholder="mis. New Arrival" />
          </Field>
          {dpEnabled && (
            <div className="sm:col-span-2 rounded-xl border border-sand-200 bg-sand-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-sand-800">
                <input type="checkbox" checked={dpKustom} onChange={(e) => setDpKustom(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                DP khusus Produk ini
              </label>
              <p className="mt-1 text-xs text-sand-500">
                Kosongkan bila Produk ini mengikuti DP Batch PO ({formatDpDefaultLabel(campaignDp)}).
              </p>
              {dpKustom && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Tipe DP">
                    <Select name="dpTipe" value={dpTipe} onChange={(e) => setDpTipe(e.target.value as "PERSEN" | "NOMINAL")}>
                      <option value="PERSEN">Persen</option>
                      <option value="NOMINAL">Nominal per unit</option>
                    </Select>
                  </Field>
                  {dpTipe === "NOMINAL" ? (
                    <Field label="DP Nominal (Rp)">
                      <CurrencyInput name="dpNominal" placeholder="mis. 50.000" />
                    </Field>
                  ) : (
                    <Field label="DP Persen (%)">
                      <Input name="dpPercent" type="number" min={1} max={100} placeholder="mis. 70" />
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <input type="hidden" name="imagesJson" value="[]" />
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menempelkan…" : "Tempel Produk ke Batch PO ini"}
        </Button>
      </div>
    </form>
  );
}
