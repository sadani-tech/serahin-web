"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CatalogQuickAdd({ detailHref, event, item }: {
  detailHref: string;
  event: { salesEventId: string; eventTitle: string; formToken: string; sellerName: string; endsAt: string };
  item: { variantId: string; name: string; price: number; image?: string | null; colors?: string[]; quotaRemaining: number };
}) {
  const { addItem } = useCart();
  if (item.colors?.length) return <Link href={detailHref} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2 text-xs font-extrabold text-white hover:bg-brand-700 sm:min-h-11 sm:rounded-xl sm:px-3 sm:text-sm">
    <CartIcon />
    <span className="hidden sm:inline">Pilih opsi</span>
    <span className="sm:hidden">Opsi</span>
  </Link>;
  return <button type="button" onClick={async()=>{await addItem(event,{variantId:item.variantId,name:item.name,price:item.price,quantity:1,image:item.image,colors:item.colors});}} disabled={item.quotaRemaining<=0} className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2 text-xs font-extrabold text-white hover:bg-brand-700 disabled:bg-sand-200 disabled:text-sand-500 sm:min-h-11 sm:rounded-xl sm:px-3 sm:text-sm">
    {item.quotaRemaining>0 ? <>
      <CartIcon />
      <span className="hidden sm:inline">+ Keranjang</span>
    </> : <span>Habis</span>}
  </button>;
}

function CartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/></svg>;
}
