"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { useCart } from "@/components/CartProvider";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { PublicProduct } from "@/lib/public-product";

export function ProductDetailClient({
  product,
  initialVariantId,
}: {
  product: PublicProduct;
  initialVariantId?: string;
}) {
  const available = product.variants.filter((variant) => variant.offering);
  const initialVariant = available.find((variant) => variant.id === initialVariantId);
  const [variantId, setVariantId] = useState(
    initialVariant?.id ?? available[0]?.id ?? product.variants[0]?.id ?? "",
  );
  const [salesEventId, setSalesEventId] = useState("");
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId) ?? product.variants[0], [product.variants, variantId]);
  const [color, setColor] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [preview, setPreview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const offerings = variant?.offerings?.length ? variant.offerings : variant?.offering ? [variant.offering] : [];
  const offering = offerings.find((item) => item.salesEventId === salesEventId) ?? offerings[0];
  const image = variant?.images[imageIndex] ?? variant?.images[0] ?? null;
  const canOrder = Boolean(offering?.orderable && offering.quotaRemaining > 0 && (!variant.colors.length || color));

  async function add() {
    if (!variant || !offering || !canOrder) return;
    const ok = await addItem({
      salesEventId: offering.salesEventId,
      eventTitle: offering.eventTitle,
      formToken: offering.formToken,
      sellerName: product.seller.businessName,
      endsAt: offering.endsAt,
    }, {
      variantId: variant.id,
      name: `${product.name} — ${variant.name}`,
      price: offering.price,
      quantity,
      selectedColor: color || undefined,
      image,
      colors: variant.colors,
    });
    if (ok) setMessage("Produk ditambahkan ke keranjang.");
  }

  async function share() {
    if (navigator.share) await navigator.share({ title: product.name, url: window.location.href });
    else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${window.location.href}`)}`, "_blank", "noopener,noreferrer");
    }
  }

  return <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
    <section className="order-2 lg:row-span-2 lg:order-1">
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm">
        <button type="button" onClick={() => variant?.images.length && setPreview(true)} className="block aspect-square w-full bg-sand-100"><ProductImage src={image} alt={product.name} className="h-full w-full object-cover" /></button>
      </div>
      {variant?.images && variant.images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">
        {variant.images.slice(0, 5).map((src, index) => <button type="button" onClick={() => setImageIndex(index)} key={src} className={`aspect-square overflow-hidden rounded-xl border bg-white ${index === imageIndex ? "border-brand-600 ring-2 ring-brand-100" : "border-sand-200"}`}><ProductImage src={src} alt={`${product.name} gambar ${index + 1}`} className="h-full w-full object-cover" /></button>)}
      </div>}
    </section>

    <section className="order-1 rounded-3xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8 lg:order-2">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">{product.seller.businessName}</p><h1 className="mt-2 text-3xl font-extrabold text-sand-900">{product.name}</h1></div>
        <button type="button" onClick={share} className="min-h-11 rounded-xl border border-sand-300 px-4 text-sm font-bold text-sand-700">Bagikan</button>
      </div>
      {product.description && <div className="prose-serahin mt-5" dangerouslySetInnerHTML={{ __html: product.description }} />}
    </section>

    <section className="order-3 rounded-3xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8 lg:order-3">
      <div className="mt-6">
        <label className="text-sm font-extrabold text-sand-700">Pilihan produk
          <select value={variantId} onChange={(event) => { setVariantId(event.target.value); setSalesEventId(""); setColor(""); setImageIndex(0); }} className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-3">
            {product.variants.map((item) => <option key={item.id} value={item.id}>{item.name}{item.offering ? ` — ${formatRupiah(item.offering.price)}` : " — arsip"}</option>)}
          </select>
        </label>
      </div>

      {offerings.length > 1 && <label className="mt-5 block text-sm font-extrabold text-sand-700">Pilih Batch PO
        <select value={offering?.salesEventId ?? ""} onChange={(event) => setSalesEventId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-brand-300 bg-brand-50 px-3">
          {offerings.map((item) => <option key={item.salesEventId} value={item.salesEventId}>{item.eventTitle} — {formatRupiah(item.price)} — tutup {formatTanggal(item.endsAt)}</option>)}
        </select>
        <span className="mt-1 block text-xs font-normal text-sand-500">Produk tersedia di beberapa Batch PO. Pilihan Anda menentukan harga, kuota, dan skema pembayaran.</span>
      </label>}

      {variant && <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {variant.category && <p className="rounded-xl bg-sand-50 p-3"><span className="block text-xs font-bold text-sand-500">Kategori</span>{variant.category}</p>}
        {variant.size && <p className="rounded-xl bg-sand-50 p-3"><span className="block text-xs font-bold text-sand-500">Ukuran</span>{variant.size}</p>}
        {variant.material && <p className="rounded-xl bg-sand-50 p-3"><span className="block text-xs font-bold text-sand-500">Material</span>{variant.material}</p>}
        {variant.sku && <p className="rounded-xl bg-sand-50 p-3"><span className="block text-xs font-bold text-sand-500">SKU</span>{variant.sku}</p>}
      </div>}

      {variant?.colors.length ? <fieldset className="mt-5"><legend className="text-sm font-extrabold text-sand-700">Warna</legend><div className="mt-2 flex flex-wrap gap-2">{variant.colors.map((item) => <button key={item} type="button" onClick={() => setColor(item)} className={`min-h-11 rounded-xl border px-4 text-sm font-bold ${color === item ? "border-brand-600 bg-brand-50 text-brand-800" : "border-sand-300"}`}>{item}</button>)}</div></fieldset> : null}

      {offering ? <div className="mt-6 rounded-2xl bg-cream-soft p-4">
        <p className="text-2xl font-extrabold text-brand-700">{formatRupiah(offering.price)}</p>
        <p className="mt-1 text-sm font-bold text-sand-600">{offering.eventTitle} · tutup {formatTanggal(offering.endsAt)} · sisa {offering.quotaRemaining}</p>
        {(offering.productionEstimate || offering.shippingEstimate) && <p className="mt-2 text-xs text-sand-500">{offering.productionEstimate ? `Estimasi produksi ${formatTanggal(offering.productionEstimate)}` : ""}{offering.productionEstimate && offering.shippingEstimate ? " · " : ""}{offering.shippingEstimate ? `estimasi kirim ${formatTanggal(offering.shippingEstimate)}` : ""}</p>}
      </div> : <p className="mt-6 rounded-2xl bg-sand-100 p-4 text-sm font-bold text-sand-600">Produk ini ditampilkan sebagai arsip dan belum tersedia pada Batch PO aktif.</p>}

      <div className="mt-5 flex gap-3">
        <label className="w-24 text-sm font-bold text-sand-700">Jumlah<input type="number" min={1} max={offering?.quotaRemaining ?? 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="mt-1 min-h-12 w-full rounded-xl border border-sand-300 px-3" /></label>
        <button type="button" disabled={!canOrder} onClick={add} className="mt-6 min-h-12 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white disabled:bg-sand-300">{offering?.orderable ? "Tambah ke Keranjang" : "Batch PO Ditutup"}</button>
      </div>
      {message && <p role="status" className="mt-3 text-sm font-bold text-brand-700">{message} <Link href="/cart" className="underline">Buka keranjang</Link></p>}
      <p className="mt-5 text-xs leading-5 text-sand-500">Keranjang dan pembayaran tetap mengikuti satu Batch PO agar skema DP/pelunasan, kuota, dan timeline Serahin tetap jelas.</p>
      {preview && variant?.images.length ? <ImagePreviewModal images={variant.images} startIndex={imageIndex} title={product.name} onClose={() => setPreview(false)} /> : null}
    </section>
  </div>;
}
