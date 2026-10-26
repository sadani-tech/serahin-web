"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

/**
 * Tombol keranjang di kartu katalog — ikon saja (tanpa teks), lingkaran kecil
 * di sisi kanan `.pcard__actions` (lihat .pcard__cart di revamp.css).
 */
export function CatalogQuickAdd({ detailHref, event, item, role }: {
  detailHref: string;
  event: { salesEventId: string; eventTitle: string; formToken: string; sellerId?: string | null; sellerName: string; endsAt: string };
  item: { variantId: string; name: string; price: number; image?: string | null; colors?: string[]; quotaRemaining: number };
  role?: string;
}) {
  const { addItem } = useCart();
  if (role === "SELLER") return null;
  if (item.colors?.length) {
    return (
      <Link href={detailHref} className="pcard__cart" aria-label={`Pilih opsi ${item.name}`} title="Pilih opsi">
        <CartIcon />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={async () => { await addItem(event, { variantId: item.variantId, name: item.name, price: item.price, quantity: 1, image: item.image, colors: item.colors }); }}
      disabled={item.quotaRemaining <= 0}
      className="pcard__cart"
      aria-label={item.quotaRemaining > 0 ? `Tambah ${item.name} ke keranjang` : `${item.name} — kuota habis`}
      title={item.quotaRemaining > 0 ? "Tambah ke keranjang" : "Kuota habis"}
    >
      <CartIcon />
    </button>
  );
}

function CartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/></svg>;
}
