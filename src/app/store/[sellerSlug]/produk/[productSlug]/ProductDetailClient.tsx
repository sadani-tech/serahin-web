"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { useCart } from "@/components/CartProvider";
import { Icon } from "@/components/revamp/IconSprite";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { PublicProduct } from "@/lib/public-product";

export function ProductDetailClient({
  product,
  initialVariantId,
  role,
}: {
  product: PublicProduct;
  initialVariantId?: string;
  /** Seller tidak berbelanja sebagai Buyer (v2.3.9 FR-42.11). */
  role?: string;
}) {
  const router = useRouter();
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
  const { addItem } = useCart();
  const offerings = variant?.offerings?.length ? variant.offerings : variant?.offering ? [variant.offering] : [];
  const offering = offerings.find((item) => item.salesEventId === salesEventId) ?? offerings[0];
  const images = variant?.images ?? [];
  const image = images[imageIndex] ?? images[0] ?? null;
  const isSeller = role === "SELLER";
  const canOrder = !isSeller && Boolean(offering?.orderable && offering.quotaRemaining > 0 && (!variant.colors.length || color));

  async function add(goToCheckout = false) {
    if (isSeller || !variant || !offering || !canOrder) return;
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
    if (!ok) return;
    if (goToCheckout) router.push("/cart?checkout=1");
  }

  async function share() {
    if (navigator.share) await navigator.share({ title: product.name, url: window.location.href });
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${window.location.href}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="pd-top" aria-labelledby="pd-name">
      <div className="pd-gallery">
        <button type="button" className="pd-main" onClick={() => images.length && setPreview(true)} aria-label="Perbesar foto produk">
          <ProductImage src={image} alt={product.name} className="pd-main__img" />
          <span className="pd-main__zoom" aria-hidden="true"><Icon name="expand" /></span>
        </button>
        {images.length > 1 && (
          <ul className="pd-thumbs" aria-label="Foto produk">
            {images.slice(0, 5).map((src, index) => (
              <li key={src}>
                <button
                  type="button"
                  className={`pd-thumb${index === imageIndex ? " is-active" : ""}`}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Lihat foto ${index + 1}`}
                  aria-pressed={index === imageIndex}
                >
                  <ProductImage src={src} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pd-info">
        <div className="pd-info__inner">
          <Link href="/catalog" className="pd-back"><Icon name="arrow-left" />Kembali</Link>

          <p className="pd-seller">{product.seller.businessName}</p>
          <h1 className="pd-name" id="pd-name">{product.name}</h1>
          <p className="pd-price">{offering ? formatRupiah(offering.price) : "—"}</p>

          {offering && (
            <div className="pd-meta">
              <span>Sisa {offering.quotaRemaining} pcs</span>
              <span className="pd-meta__dot" aria-hidden="true" />
              <span className="pd-meta__date"><Icon name="calendar" />Tutup PO: {formatTanggal(offering.endsAt)}</span>
            </div>
          )}

          <div className="pd-buy">
            <div className="pd-variant-select">
              <label>
                Pilihan produk
                <select value={variantId} onChange={(e) => { setVariantId(e.target.value); setSalesEventId(""); setColor(""); setImageIndex(0); }}>
                  {product.variants.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}{item.offering ? ` — ${formatRupiah(item.offering.price)}` : " — arsip"}</option>
                  ))}
                </select>
              </label>
              {offerings.length > 1 && (
                <label>
                  Batch PO
                  <select value={offering?.salesEventId ?? ""} onChange={(e) => setSalesEventId(e.target.value)}>
                    {offerings.map((item) => (
                      <option key={item.salesEventId} value={item.salesEventId}>{item.eventTitle} — {formatRupiah(item.price)} — tutup {formatTanggal(item.endsAt)}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {variant?.colors.length ? (
              <fieldset className="pd-variants">
                <legend className="pd-variants__label">Warna: <strong>{color || "pilih"}</strong></legend>
                {variant.colors.map((item) => (
                  <label key={item} className="pd-swatch pd-swatch--text">
                    <input type="radio" name="color" value={item} checked={color === item} onChange={() => setColor(item)} />
                    <span className="pd-swatch__chip">{item}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}

            {!isSeller && (
              <label className="pd-qty">
                Jumlah
                <input type="number" min={1} max={offering?.quotaRemaining ?? 1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              </label>
            )}

            <div className="pd-actions">
              {isSeller ? (
                <p className="pd-seller-note">Akun Seller tidak bisa memesan sebagai Buyer.</p>
              ) : (
                <>
                  <button type="button" disabled={!canOrder} onClick={() => void add(true)} className="pcard__buy pd-actions__buy">
                    {offering?.orderable ? "Beli Produk" : "Batch PO Ditutup"}
                  </button>
                  <button type="button" disabled={!canOrder} onClick={() => void add(false)} className="pcard__cart" aria-label={`Tambah ${product.name} ke keranjang`}>
                    <Icon name="cart-plus" />
                  </button>
                </>
              )}
            </div>
          </div>

          <hr className="pd-rule" />

          {product.description && (
            <section className="pd-desc" aria-labelledby="pd-desc-title">
              <h2 className="pd-desc__title" id="pd-desc-title">Deskripsi produk</h2>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </section>
          )}

          <button type="button" onClick={() => void share()} className="btn btn--ghost btn--sm pd-share">
            <span>Bagikan</span><span className="btn__icon"><Icon name="arrow-right" /></span>
          </button>
        </div>
      </div>

      {preview && images.length ? <ImagePreviewModal images={images} startIndex={imageIndex} title={product.name} onClose={() => setPreview(false)} /> : null}
    </section>
  );
}
