"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Field, FormError, Input } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FileUploadField } from "@/components/FileUploadField";
import { ProductImage } from "@/components/ProductImage";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { formatRupiah } from "@/lib/format";
import { createPublicOrder } from "../actions";
import type { PublicOrderState } from "../constants";
import { publicSite } from "@/lib/public-site";
import { ToastFeedback } from "@/components/Toast";
import { BuyerAccessModal } from "@/components/BuyerAccessModal";
import { CopyButton } from "@/components/CopyButton";
import { computeDownPaymentTarget } from "@/lib/billing";

export type PublicVariantOption = {
  id: string;
  productSlug?: string | null;
  namaVarian: string;
  sisa: number;
  harga: number;
  gambarUrl?: string | null;
  images?: string[];
  warna?: string[];
  kategori?: string | null;
  label?: string | null;
  ukuran?: string | null;
  material?: string | null;
  sku?: string | null;
  deskripsi?: string | null;
};

const CATALOG_PAGE_SIZE = 8;
const draftExpiresAt = () => Date.now() + 24 * 60 * 60 * 1000;
const draftIsExpired = (value?: number) => !value || value < Date.now();

function getCategory(value?: string | null) {
  const category = value?.trim();
  return category && category.toLowerCase() !== "others" ? category : "Others";
}

export function PublicOrderForm({
  formToken,
  variants,
  gatewayEnabled = false,
  manualTransferEnabled = false,
  manualTransfer,
  paymentScheme = "DP_PELUNASAN",
  dpTipe = "PERSEN",
  dpPercent = 50,
  dpNominal = null,
  orderingDisabled = false,
  unavailableMessage,
  checkoutSource = "CAMPAIGN_LINK",
  idPrefix = formToken,
  buyerAuthenticated = false,
  switchingAccount = false,
  buyerProfile,
  resumeCheckout = false,
}: {
  formToken: string;
  variants: PublicVariantOption[];
  gatewayEnabled?: boolean;
  manualTransferEnabled?: boolean;
  manualTransfer?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  } | null;
  paymentScheme?: "DP_PELUNASAN" | "LUNAS";
  dpTipe?: "PERSEN" | "NOMINAL";
  dpPercent?: number | null;
  dpNominal?: number | null;
  orderingDisabled?: boolean;
  unavailableMessage?: string;
  checkoutSource?: "CAMPAIGN_LINK" | "HOME_CATALOG";
  idPrefix?: string;
  buyerAuthenticated?: boolean;
  switchingAccount?: boolean;
  buyerProfile?: { name: string; email: string | null; phone: string | null } | null;
  resumeCheckout?: boolean;
}) {
  const action = createPublicOrder.bind(null, formToken);
  const [state, formAction, pending] = useActionState<PublicOrderState, FormData>(
    action,
    undefined,
  );
  const checkoutKey = useRef("");
  // v2.1 — kanal pembayaran. Default "otomatis" bila gateway aktif.
  const [metodeBayar, setMetodeBayar] = useState<"GATEWAY" | "MANUAL">(
    gatewayEnabled ? "GATEWAY" : "MANUAL",
  );
  const gateway = gatewayEnabled && metodeBayar === "GATEWAY";
  const paymentUnavailable = gateway ? !gatewayEnabled : !manualTransferEnabled;
  const [qty, setQty] = useState<Record<string, number>>({});
  const [warnaSel, setWarnaSel] = useState<Record<string, string>>({});
  const [variantImageIndex, setVariantImageIndex] = useState<Record<string, number>>({});
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Semua");
  const [catalogPage, setCatalogPage] = useState(1);
  const [preview, setPreview] = useState<{
    images: string[];
    title: string;
    start: number;
  } | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(`serahin:checkout:${formToken}`);
        if (!raw) return;
        const draft = JSON.parse(raw) as { expiresAt?: number; qty?: Record<string, number>; colors?: Record<string, string> };
        if (draftIsExpired(draft.expiresAt)) {
          localStorage.removeItem(`serahin:checkout:${formToken}`);
          return;
        }
        if (draft.qty) setQty(draft.qty);
        if (draft.colors) setWarnaSel(draft.colors);
      } catch { localStorage.removeItem(`serahin:checkout:${formToken}`); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [formToken]);

  useEffect(() => {
    if (!buyerAuthenticated || !resumeCheckout) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`${idPrefix}-checkout`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [buyerAuthenticated, idPrefix, resumeCheckout]);

  useEffect(() => {
    if (!state?.error && !state?.warning) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`${idPrefix}-checkout`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [idPrefix, state]);

  const setQ = (id: string, value: number) =>
    setQty((current) => ({ ...current, [id]: Math.max(0, value) }));
  const selectedVariants = variants.filter((v) => (qty[v.id] ?? 0) > 0);
  const items = selectedVariants.map((v) => ({
    variantId: v.id,
    jumlah: qty[v.id] ?? 0,
    expectedHarga: v.harga,
    warna: warnaSel[v.id] || undefined,
  }));
  const total = variants.reduce((sum, v) => sum + v.harga * (qty[v.id] ?? 0), 0);
  const dpTarget = paymentScheme === "DP_PELUNASAN"
    ? computeDownPaymentTarget(
        selectedVariants.map((variant) => ({
          hargaSaatPesan: variant.harga,
          jumlah: qty[variant.id] ?? 0,
        })),
        dpTipe,
        dpPercent,
        dpNominal,
      )
    : total;
  const jumlahBayar = String(dpTarget);
  const jumlahItem = items.reduce((sum, item) => sum + item.jumlah, 0);
  const adaItem = items.length > 0;
  const warnaBelumLengkap = variants.some(
    (v) =>
      (qty[v.id] ?? 0) > 0 &&
      v.warna &&
      v.warna.length > 0 &&
      !warnaSel[v.id],
  );
  const paymentRule = paymentScheme === "LUNAS"
    ? "Pembayaran lunas sesuai total pesanan."
    : dpTipe === "NOMINAL"
      ? `${formatRupiah(dpNominal ?? 0)} per unit × ${jumlahItem} unit.`
      : `${dpPercent ?? 50}% dari harga setiap unit produk.`;
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, string>();
    variants.forEach((variant) => {
      const category = getCategory(variant.kategori);
      const key = category.toLocaleLowerCase("id-ID");
      if (!categories.has(key)) categories.set(key, category);
    });

    return Array.from(categories.values()).sort((a, b) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return a.localeCompare(b, "id-ID");
    });
  }, [variants]);
  const filteredVariants = useMemo(() => {
    const query = catalogSearch.trim().toLocaleLowerCase("id-ID");

    return variants.filter((variant) => {
      const category = getCategory(variant.kategori);
      if (
        catalogCategory !== "Semua" &&
        category.toLocaleLowerCase("id-ID") !== catalogCategory.toLocaleLowerCase("id-ID")
      ) {
        return false;
      }
      if (!query) return true;

      return variant.namaVarian.toLocaleLowerCase("id-ID").includes(query);
    });
  }, [catalogCategory, catalogSearch, variants]);
  const totalCatalogPages = Math.max(1, Math.ceil(filteredVariants.length / CATALOG_PAGE_SIZE));
  const currentCatalogPage = Math.min(catalogPage, totalCatalogPages);
  const visibleVariants = filteredVariants.slice(
    (currentCatalogPage - 1) * CATALOG_PAGE_SIZE,
    currentCatalogPage * CATALOG_PAGE_SIZE,
  );

  function changeCatalogSearch(value: string) {
    setCatalogSearch(value);
    setCatalogPage(1);
  }

  function changeCatalogCategory(value: string) {
    setCatalogCategory(value);
    setCatalogPage(1);
  }

  function slideVariantImage(variantId: string, imageCount: number, direction: -1 | 1) {
    setVariantImageIndex((current) => {
      const activeIndex = current[variantId] ?? 0;
      return {
        ...current,
        [variantId]: (activeIndex + direction + imageCount) % imageCount,
      };
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (orderingDisabled) return;
    if (!buyerAuthenticated) {
      persistDraft();
      setShowAccessModal(true);
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("cart", JSON.stringify(items));
    fd.set("jumlahBayar", jumlahBayar);
    fd.set("metodeBayar", gateway ? "GATEWAY" : "MANUAL");
    fd.set("checkoutSource", checkoutSource);
    if (!checkoutKey.current) checkoutKey.current = window.crypto.randomUUID();
    fd.set("checkoutKey", checkoutKey.current);
    persistDraft();
    startTransition(() => formAction(fd));
  }

  function persistDraft() {
    localStorage.setItem(`serahin:checkout:${formToken}`, JSON.stringify({ qty, colors: warnaSel, expiresAt: draftExpiresAt() }));
  }

  function scrollToCheckout() {
    if (!buyerAuthenticated) {
      persistDraft();
      setShowAccessModal(true);
      return;
    }
    document.getElementById(`${idPrefix}-checkout`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="checkoutSource" value={checkoutSource} />
      <input type="hidden" name="policyVersion" value={publicSite.policyVersion} />
      <input
        type="hidden"
        name="whatsappConsentVersion"
        value={publicSite.whatsappConsentVersion}
      />
      <p className="sr-only" aria-live="polite">
        Keranjang berisi {jumlahItem} item dengan total {formatRupiah(total)}.
      </p>

      {state?.error && <FormError message={state.error} />}
      <ToastFeedback warning={(state?.needsConfirm || state?.needsCartConfirm) ? state.warning : undefined} />
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

        <div className="mb-4 rounded-2xl border border-sand-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-sand-600">Cari produk</span>
              <Input
                type="search"
                value={catalogSearch}
                onChange={(event) => changeCatalogSearch(event.target.value)}
                placeholder="Nama produk..."
                aria-label="Cari produk di katalog"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-sand-600">Kategori</span>
              <select
                value={catalogCategory}
                onChange={(event) => changeCatalogCategory(event.target.value)}
                aria-label="Filter kategori produk"
                className="h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm font-semibold text-sand-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                <option value="Semua">Semua kategori</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs font-semibold text-sand-500" aria-live="polite">
            Menampilkan {filteredVariants.length} dari {variants.length} produk
            {catalogCategory !== "Semua" ? ` dalam kategori ${catalogCategory}` : ""}.
          </p>
        </div>

        {visibleVariants.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
            {visibleVariants.map((v, index) => {
            const habis = v.sisa <= 0;
            const disabled = orderingDisabled || habis;
            const jumlah = qty[v.id] ?? 0;
            const images = v.images?.length ? v.images : v.gambarUrl ? [v.gambarUrl] : [];
            const activeImageIndex = images.length
              ? Math.min(variantImageIndex[v.id] ?? 0, images.length - 1)
              : 0;
            const gambarUtama = images[activeImageIndex] ?? v.gambarUrl;
            const category = getCategory(v.kategori);
            const katalogMeta = [
              v.ukuran && { label: "Ukuran", value: v.ukuran },
              v.material && { label: "Material", value: v.material },
              v.sku && { label: "SKU", value: v.sku },
            ].filter(Boolean) as { label: string; value: string }[];

            return (
              <article
                key={v.id}
                className={`animate-rise flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  habis ? "border-sand-200 opacity-75" : "border-sand-200"
                }`}
                style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
              >
                <div className="relative aspect-square bg-sand-100">
                  {images.length ? (
                    <button
                      type="button"
                      onClick={() => setPreview({ images, title: v.namaVarian, start: activeImageIndex })}
                      className="block h-full w-full"
                      aria-label={`Perbesar gambar ${activeImageIndex + 1} ${v.namaVarian}`}
                    >
                      <ProductImage src={gambarUtama} alt={`${v.namaVarian} gambar ${activeImageIndex + 1}`} className="h-full w-full object-cover" iconClassName="h-12 w-12" />
                    </button>
                  ) : (
                    <ProductImage src={gambarUtama} alt={v.namaVarian} className="h-full w-full object-cover" iconClassName="h-12 w-12" />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-wide text-white shadow-brand sm:left-3 sm:top-3 sm:text-[0.65rem]">Pre-Order</span>
                  {habis && <span className="absolute bottom-2 right-2 rounded-full bg-rose-600 px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-wide text-white sm:bottom-auto sm:right-3 sm:top-3 sm:text-[0.65rem]">Stok Habis</span>}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => slideVariantImage(v.id, images.length, -1)}
                        aria-label={`Gambar sebelumnya ${v.namaVarian}`}
                        className="absolute left-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sand-800 shadow ring-1 ring-sand-200 transition hover:bg-white sm:left-2"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => slideVariantImage(v.id, images.length, 1)}
                        aria-label={`Gambar berikutnya ${v.namaVarian}`}
                        className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sand-800 shadow ring-1 ring-sand-200 transition hover:bg-white sm:right-2"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      <div role="status" className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-sand-900/70 px-2 py-1" aria-label={`Gambar ${activeImageIndex + 1} dari ${images.length}`}>
                        {images.map((_, imageIndex) => (
                          <span
                            key={imageIndex}
                            className={`h-1.5 rounded-full transition-all ${
                              imageIndex === activeImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/55"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-1 flex-col space-y-2.5 p-3 sm:space-y-3 sm:p-4">
                  <div>
                    <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-sand-900 sm:text-base">{v.namaVarian}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {category !== "Others" && (
                        <span className="rounded-full bg-brand-50 px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200 sm:text-[0.65rem]">
                          {category}
                        </span>
                      )}
                      {v.label && (
                        <span className="rounded-full bg-accent-100 px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-wide text-accent-800 ring-1 ring-accent-200 sm:text-[0.65rem]">
                          {v.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-base font-extrabold text-brand-700 sm:text-lg">{formatRupiah(v.harga)}</p>
                    <p className={`mt-1 text-xs font-bold ${habis ? "text-rose-700" : "text-sand-500"}`}>
                      {habis ? "Kuota sudah penuh" : `Sisa ${v.sisa} unit`}
                    </p>
                  </div>

                  {(katalogMeta.length > 0 || v.deskripsi) && (
                    <div className="space-y-2 border-y border-sand-100 py-2.5 text-[0.7rem] sm:py-3 sm:text-xs">
                      {katalogMeta.length > 0 && (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {katalogMeta.map((item) => (
                            <div key={item.label} className="contents">
                              <dt className="font-bold text-sand-500">{item.label}</dt>
                              <dd className="min-w-0 break-words text-right font-semibold text-sand-700">{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {v.deskripsi && <p className="line-clamp-3 leading-relaxed text-sand-600">{v.deskripsi}</p>}
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
                              className={`min-h-9 rounded-lg border px-2 text-[0.7rem] font-bold transition sm:px-2.5 sm:text-xs ${
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

                  <div className="mt-auto border-t border-sand-100 pt-2.5">
                    <span className="mb-1.5 block text-[0.7rem] font-bold text-sand-600 sm:text-xs">Jumlah</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={() => setQ(v.id, jumlah - 1)} disabled={disabled || jumlah === 0} aria-label={`Kurangi jumlah ${v.namaVarian}`} className="flex h-11 items-center justify-center rounded-xl bg-sand-100 text-xl font-bold text-sand-700 hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40">−</button>
                      <output className="flex h-11 items-center justify-center rounded-xl bg-sand-50 px-1 text-sm font-extrabold text-sand-900" aria-label={`Jumlah ${v.namaVarian}`}>{jumlah}</output>
                      <button
                        type="button"
                        onClick={() => setQ(v.id, Math.min(v.sisa, jumlah + 1))}
                        disabled={disabled || jumlah >= v.sisa}
                        aria-label={`Tambah jumlah ${v.namaVarian}`}
                        className="flex h-11 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow-brand hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
        ) : (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white px-4 py-10 text-center">
            <p className="font-extrabold text-sand-800">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-sand-500">Coba kata kunci lain atau pilih semua kategori.</p>
            <button
              type="button"
              onClick={() => {
                changeCatalogSearch("");
                changeCatalogCategory("Semua");
              }}
              className="mt-4 min-h-11 rounded-xl border border-brand-300 px-4 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Reset pencarian
            </button>
          </div>
        )}

        {totalCatalogPages > 1 && (
          <nav className="mt-5 flex items-center justify-center gap-2" aria-label="Pagination katalog">
            <button
              type="button"
              onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}
              disabled={currentCatalogPage === 1}
              className="min-h-11 rounded-xl border border-sand-300 bg-white px-3 text-sm font-bold text-sand-700 hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="min-w-16 text-center text-sm font-bold text-sand-600" aria-current="page">
              {currentCatalogPage} / {totalCatalogPages}
            </span>
            <button
              type="button"
              onClick={() => setCatalogPage((page) => Math.min(totalCatalogPages, page + 1))}
              disabled={currentCatalogPage === totalCatalogPages}
              className="min-h-11 rounded-xl border border-sand-300 bg-white px-3 text-sm font-bold text-sand-700 hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </nav>
        )}
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
            {buyerAuthenticated ? "Konfirmasi & Bayar" : "Lanjutkan Pesanan"}
          </Button>
          {adaItem && <button type="button" onClick={() => { setQty({}); setWarnaSel({}); localStorage.removeItem(`serahin:checkout:${formToken}`); }} className="mt-3 w-full text-sm font-bold text-sand-500 hover:text-rose-700">Batalkan pilihan</button>}
        </div>
      </section>

      <section id={`${idPrefix}-checkout`} className="scroll-mt-24 rounded-2xl border border-sand-200 bg-white shadow-lg" aria-labelledby={`${idPrefix}-checkout-heading`}>
        <div className="bg-serahin-ribbon h-1.5" aria-hidden="true" />
        <div className="mx-auto max-w-2xl space-y-5 p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Checkout</p>
            <h2 id={`${idPrefix}-checkout-heading`} className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">Konfirmasi dan bayar</h2>
            <p className="mt-1 text-sm text-sand-500">Pilihan produk di atas langsung menjadi pesananmu. Tidak perlu mengisi form produk lagi.</p>
          </div>

          {buyerAuthenticated && buyerProfile ? (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
              <div><p className="font-extrabold">Data Buyer otomatis digunakan</p><p className="mt-1 text-xs leading-5">{buyerProfile.name} · {buyerProfile.email ?? "Email belum tersedia"}{buyerProfile.phone ? ` · ${buyerProfile.phone}` : ""}</p></div>
              <Link href={`/account/profile?callbackUrl=${encodeURIComponent(`/po/${formToken}?checkout=1`)}`} className="text-xs font-extrabold underline">Ubah profil</Link>
            </div>
          ) : (
            <div className="rounded-xl bg-sun-50 px-4 py-3 text-sm text-sun-900 ring-1 ring-inset ring-sun-200">
              Pilihanmu disimpan selama 24 jam. Masuk hanya diperlukan saat kamu siap membuat pesanan.
            </div>
          )}
          {gatewayEnabled && (
            <Field label="Metode pembayaran" required>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["GATEWAY", "Bayar otomatis", "QRIS / VA / e-wallet / kartu — verifikasi instan"],
                    ["MANUAL", "Transfer manual", "Transfer bank lalu unggah bukti — diverifikasi Admin"],
                  ] as const
                ).map(([value, judul, sub]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      metodeBayar === value
                        ? "border-brand-500 bg-sand-50 ring-1 ring-brand-500"
                        : "border-sand-200 hover:border-sand-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodeBayarRadio"
                      value={value}
                      checked={metodeBayar === value}
                      onChange={() => setMetodeBayar(value)}
                      disabled={orderingDisabled || (value === "MANUAL" && !manualTransferEnabled)}
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                    />
                    <span>
                      <span className="block font-bold text-sand-800">{judul}</span>
                      <span className="block text-xs text-sand-500">{sub}</span>
                      {value === "MANUAL" && !manualTransferEnabled && <span className="mt-1 block text-xs font-bold text-rose-700">Rekening Seller belum tersedia.</span>}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          )}

          {gateway ? (
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
              Setelah menekan tombol di bawah, Anda akan diarahkan ke halaman
              pembayaran. Pesanan otomatis terverifikasi begitu pembayaran
              berhasil — tidak perlu unggah bukti.
            </div>
          ) : (
            <>
              {manualTransfer ? (
                <div className="rounded-xl bg-sun-50 px-4 py-3 text-sm text-sun-950 ring-1 ring-inset ring-sun-200">
                  <p className="text-xs font-extrabold uppercase tracking-wider">Rekening tujuan Seller</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <p><span className="block text-xs opacity-70">Bank</span><strong>{manualTransfer.bankName}</strong></p>
                    <p>
                      <span className="block text-xs opacity-70">Nomor rekening</span>
                      <span className="flex items-center gap-2">
                        <strong className="font-mono text-base tracking-wide">{manualTransfer.accountNumber}</strong>
                        <CopyButton text={manualTransfer.accountNumber} />
                      </span>
                    </p>
                    <p className="sm:col-span-2"><span className="block text-xs opacity-70">Atas nama</span><strong>{manualTransfer.accountHolderName}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-inset ring-rose-200">Seller belum menyediakan rekening transfer. Pilih pembayaran otomatis atau hubungi Seller.</div>
              )}
              <FileUploadField name="buktiPembayaran" label="Bukti pembayaran" hint="Unggah bukti transfer — JPG, PNG, WEBP, atau PDF (maks 5MB)." required disabled={orderingDisabled} />
              <Field label={paymentScheme === "DP_PELUNASAN" ? "Nominal DP" : "Nominal pembayaran"} required hint={paymentRule}>
                <CurrencyInput name="jumlahBayar" required readOnly disabled={orderingDisabled} value={jumlahBayar} className="bg-sand-50 font-bold" />
              </Field>
            </>
          )}
          <div className="rounded-xl bg-cream-soft px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-sand-600">Total pesanan</span>
              <span className="text-xl font-extrabold text-sand-900">{formatRupiah(total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 border-t border-sand-200 pt-2">
              <span className="text-sm font-bold text-brand-700">{paymentScheme === "DP_PELUNASAN" ? "DP yang dibayar sekarang" : "Dibayar sekarang"}</span>
              <span className="text-lg font-extrabold text-brand-700">{formatRupiah(dpTarget)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-sand-500">{paymentRule}</p>
          </div>
          <div className="space-y-3 rounded-xl border border-sand-200 bg-white p-4 text-sm text-sand-600">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="acceptPolicies"
                value="1"
                required
                disabled={orderingDisabled}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
              />
              <span>
                Saya menyetujui{" "}
                <Link href="/terms" target="_blank" className="font-bold text-brand-700 underline">
                  Syarat & Ketentuan
                </Link>
                ,{" "}
                <Link href="/privacy" target="_blank" className="font-bold text-brand-700 underline">
                  Kebijakan Privasi
                </Link>
                , dan{" "}
                <Link href="/refund-policy" target="_blank" className="font-bold text-brand-700 underline">
                  Kebijakan Refund
                </Link>
                .
              </span>
            </label>
          </div>
          {warnaBelumLengkap && <p className="text-center text-sm font-bold text-rose-700">Pilih warna untuk setiap varian yang Anda pesan.</p>}
          <Button type="submit" className="w-full" loading={pending} disabled={orderingDisabled || !adaItem || warnaBelumLengkap || paymentUnavailable}>
            {state?.needsConfirm || state?.needsCartConfirm
              ? "Ya, lanjutkan"
              : gateway
                ? "Bayar Sekarang"
                : "Kirim Pesanan"}
          </Button>
        </div>
      </section>

      {preview && <ImagePreviewModal images={preview.images} startIndex={preview.start} title={preview.title} onClose={() => setPreview(null)} />}
      {showAccessModal && <BuyerAccessModal callbackUrl={`/po/${formToken}?checkout=1`} switchingAccount={switchingAccount} onClose={() => setShowAccessModal(false)} />}
    </form>
  );
}
