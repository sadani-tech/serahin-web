"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FileUploadField } from "@/components/FileUploadField";
import { ProductImage } from "@/components/ProductImage";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { formatRupiah } from "@/lib/format";
import { createPublicOrder } from "../actions";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "../constants";

export type PublicVariantOption = {
  id: string;
  namaVarian: string;
  sisa: number;
  harga: number;
  gambarUrl?: string | null;
  images?: string[];
  warna?: string[];
};

export function PublicOrderForm({
  formToken,
  variants,
  orderingDisabled = false,
  unavailableMessage,
}: {
  formToken: string;
  variants: PublicVariantOption[];
  orderingDisabled?: boolean;
  unavailableMessage?: string;
}) {
  const action = createPublicOrder.bind(null, formToken);
  const [state, formAction, pending] = useActionState<PublicOrderState, FormData>(
    action,
    undefined,
  );
  const [namaPembeli, setNamaPembeli] = useState("");
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [warnaSel, setWarnaSel] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{
    images: string[];
    title: string;
    start: number;
  } | null>(null);

  const setQ = (id: string, value: number) =>
    setQty((current) => ({ ...current, [id]: Math.max(0, value) }));
  const selectedVariants = variants.filter((v) => (qty[v.id] ?? 0) > 0);
  const items = selectedVariants.map((v) => ({
    variantId: v.id,
    jumlah: qty[v.id] ?? 0,
    warna: warnaSel[v.id] || undefined,
  }));
  const total = variants.reduce((sum, v) => sum + v.harga * (qty[v.id] ?? 0), 0);
  const jumlahItem = items.reduce((sum, item) => sum + item.jumlah, 0);
  const adaItem = items.length > 0;
  const warnaBelumLengkap = variants.some(
    (v) =>
      (qty[v.id] ?? 0) > 0 &&
      v.warna &&
      v.warna.length > 0 &&
      !warnaSel[v.id],
  );
  const bayarLebihDariTotal = jumlahBayar !== "" && Number(jumlahBayar) > total;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (orderingDisabled) return;
    const fd = new FormData(e.currentTarget);
    fd.set("cart", JSON.stringify(items));
    fd.set("jumlahBayar", jumlahBayar);
    startTransition(() => formAction(fd));
  }

  function scrollToCheckout() {
    document.getElementById("checkout")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="sr-only" aria-live="polite">
        Keranjang berisi {jumlahItem} item dengan total {formatRupiah(total)}.
      </p>

      {state?.error && <FormError message={state.error} />}
      {(state?.needsConfirm || state?.needsCartConfirm) && state.warning && (
        <div className="rounded-xl bg-sun-50 px-4 py-3 text-sm font-medium text-sun-800 ring-1 ring-inset ring-sun-200">
          {state.warning}
        </div>
      )}
      {state?.needsConfirm && <input type="hidden" name="confirmDuplikat" value="1" />}
      {state?.needsCartConfirm && <input type="hidden" name="confirmPerubahanKuota" value="1" />}
      {unavailableMessage && (
        <div role="status" className="rounded-2xl border border-sun-300 bg-sun-50 px-4 py-3 text-center text-sm font-bold text-sun-800">
          {unavailableMessage}
        </div>
      )}

      <section aria-labelledby="catalog-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Pilih produk</p>
            <h2 id="catalog-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">
              Katalog varian
            </h2>
          </div>
          <p className="text-sm font-semibold text-sand-500">{variants.length} pilihan tersedia</p>
        </div>

        <div className="grid gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
          {variants.map((v, index) => {
            const habis = v.sisa <= 0;
            const disabled = orderingDisabled || habis;
            const jumlah = qty[v.id] ?? 0;
            const images = v.images?.length ? v.images : v.gambarUrl ? [v.gambarUrl] : [];
            const gambarUtama = images[0] ?? v.gambarUrl;

            return (
              <article
                key={v.id}
                className={`animate-rise overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  habis ? "border-sand-200 opacity-75" : "border-sand-200"
                }`}
                style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
              >
                <div className="relative aspect-[4/5] bg-sand-100">
                  {images.length ? (
                    <button
                      type="button"
                      onClick={() => setPreview({ images, title: v.namaVarian, start: 0 })}
                      className="block h-full w-full"
                      aria-label={`Perbesar gambar ${v.namaVarian}`}
                    >
                      <ProductImage src={gambarUtama} alt={v.namaVarian} className="h-full w-full object-cover" iconClassName="h-12 w-12" />
                    </button>
                  ) : (
                    <ProductImage src={gambarUtama} alt={v.namaVarian} className="h-full w-full object-cover" iconClassName="h-12 w-12" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-white shadow-brand">Pre-Order</span>
                  {habis && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-white">Stok Habis</span>}
                  {images.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-sand-900/75 px-2 py-1 text-[0.65rem] font-bold text-white">{images.length} foto</span>}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-sand-900">{v.namaVarian}</h3>
                    <p className="mt-1 text-lg font-extrabold text-brand-700">{formatRupiah(v.harga)}</p>
                    <p className={`mt-1 text-xs font-bold ${habis ? "text-rose-700" : "text-sand-500"}`}>
                      {habis ? "Kuota sudah penuh" : `Sisa ${v.sisa} unit`}
                    </p>
                  </div>

                  {images.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {images.slice(0, 4).map((src, imageIndex) => (
                        <button
                          key={`${src}-${imageIndex}`}
                          type="button"
                          onClick={() => setPreview({ images, title: v.namaVarian, start: imageIndex })}
                          className="h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-sand-200 hover:ring-brand-500"
                          aria-label={`Lihat foto ${imageIndex + 1} ${v.namaVarian}`}
                        >
                          <ProductImage src={src} alt={`${v.namaVarian} foto ${imageIndex + 1}`} className="h-full w-full object-cover" iconClassName="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  )}

                  {v.warna?.length ? (
                    <fieldset disabled={disabled}>
                      <legend className="mb-1.5 text-xs font-bold text-sand-600">Pilih warna{jumlah > 0 && !warnaSel[v.id] ? " *" : ""}</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {v.warna.map((warna) => {
                          const selected = warnaSel[v.id] === warna;
                          return (
                            <button
                              key={warna}
                              type="button"
                              onClick={() => setWarnaSel((current) => ({ ...current, [v.id]: warna }))}
                              aria-pressed={selected}
                              className={`min-h-9 rounded-lg border px-2.5 text-xs font-bold transition ${
                                selected ? "border-brand-600 bg-brand-600 text-white" : "border-sand-300 bg-white text-sand-700 hover:border-brand-400"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {warna}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-sand-100 pt-3">
                    <span className="text-xs font-bold text-sand-600">Jumlah</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setQ(v.id, jumlah - 1)} disabled={disabled || jumlah === 0} aria-label={`Kurangi jumlah ${v.namaVarian}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-100 text-xl font-bold text-sand-700 hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40">−</button>
                      <output className="flex h-11 min-w-10 items-center justify-center rounded-xl bg-sand-50 px-2 text-sm font-extrabold text-sand-900" aria-label={`Jumlah ${v.namaVarian}`}>{jumlah}</output>
                      <button
                        type="button"
                        onClick={() => setQ(v.id, Math.min(v.sisa, MAX_UNIT_PER_SUBMISSION, jumlah + 1))}
                        disabled={disabled || jumlah >= Math.min(v.sisa, MAX_UNIT_PER_SUBMISSION)}
                        aria-label={`Tambah jumlah ${v.namaVarian}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow-brand hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white shadow-lg" aria-labelledby="summary-heading">
        <div className="bg-serahin-ribbon h-1.5" aria-hidden="true" />
        <div className="mx-auto max-w-2xl p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Keranjang</p>
          <h2 id="summary-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">Ringkasan pesanan</h2>
          {adaItem ? (
            <ul className="mt-4 space-y-3 border-y border-sand-100 py-4">
              {selectedVariants.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-sand-800">{v.namaVarian}</p>
                    <p className="text-xs text-sand-500">
                      {qty[v.id]} × {formatRupiah(v.harga)}{warnaSel[v.id] ? ` · ${warnaSel[v.id]}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-sand-800">{formatRupiah(v.harga * (qty[v.id] ?? 0))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-sand-50 px-3 py-4 text-center text-sm text-sand-500">Pilih varian dari katalog untuk memulai pesanan.</p>
          )}
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold text-sand-600">Total</span>
            <span className="text-xl font-extrabold text-sand-900">{formatRupiah(total)}</span>
          </div>
          <Button type="button" variant="accent" className="mt-5 w-full" onClick={scrollToCheckout} disabled={orderingDisabled || !adaItem || warnaBelumLengkap}>
            Lanjutkan ke Tahap Akhir
          </Button>
        </div>
      </section>

      <section id="checkout" className="scroll-mt-24 rounded-2xl border border-sand-200 bg-white shadow-lg" aria-labelledby="checkout-heading">
        <div className="bg-serahin-ribbon h-1.5" aria-hidden="true" />
        <div className="mx-auto max-w-2xl space-y-5 p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Tahap akhir</p>
            <h2 id="checkout-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">Lengkapi pesanan Anda</h2>
            <p className="mt-1 text-sm text-sand-500">Data ini dipakai Admin untuk memverifikasi pesanan dan pembayaran Anda.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" required>
              <Input name="namaPembeli" required disabled={orderingDisabled} value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)} placeholder="Nama lengkap Anda" />
            </Field>
            <Field label="WhatsApp" required>
              <Input name="wa" required disabled={orderingDisabled} value={wa} onChange={(e) => setWa(e.target.value)} placeholder="081234567890" />
            </Field>
          </div>
          <Field label="Email" required>
            <Input name="email" type="email" required disabled={orderingDisabled} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </Field>
          <FileUploadField name="buktiPembayaran" label="Bukti pembayaran" hint="Unggah bukti transfer — JPG, PNG, WEBP, atau PDF (maks 5MB)." required disabled={orderingDisabled} />
          <Field label="Jumlah yang dibayarkan" required hint={bayarLebihDariTotal ? undefined : jumlahBayar ? `= ${formatRupiah(Number(jumlahBayar))}` : "Nominal transfer sesuai bukti pembayaran."}>
            <CurrencyInput name="jumlahBayar" required disabled={orderingDisabled} value={jumlahBayar} onValueChange={setJumlahBayar} placeholder="150.000" />
            {bayarLebihDariTotal && <span className="mt-1 block text-xs font-medium text-rose-700">Jumlah yang dibayarkan tidak boleh lebih dari total harga.</span>}
          </Field>
          <div className="rounded-xl bg-cream-soft px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-sand-600">Total pesanan</span>
              <span className="text-xl font-extrabold text-sand-900">{formatRupiah(total)}</span>
            </div>
            <p className="mt-1 text-xs text-sand-500">Maksimal {MAX_UNIT_PER_SUBMISSION} unit per varian.</p>
          </div>
          {warnaBelumLengkap && <p className="text-center text-sm font-bold text-rose-700">Pilih warna untuk setiap varian yang Anda pesan.</p>}
          <Button type="submit" className="w-full" loading={pending} disabled={orderingDisabled || !adaItem || warnaBelumLengkap || bayarLebihDariTotal}>
            {state?.needsConfirm || state?.needsCartConfirm ? "Ya, lanjutkan" : "Kirim Pesanan"}
          </Button>
        </div>
      </section>

      {preview && <ImagePreviewModal images={preview.images} startIndex={preview.start} title={preview.title} onClose={() => setPreview(null)} />}
    </form>
  );
}
