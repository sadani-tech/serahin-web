"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CatalogQuickAdd({ detailHref, event, item }: {
  detailHref: string;
  event: { salesEventId: string; eventTitle: string; formToken: string; sellerName: string; endsAt: string };
  item: { variantId: string; name: string; price: number; image?: string | null; colors?: string[]; quotaRemaining: number };
}) {
  const { addItem } = useCart();
  if (item.colors?.length) return <Link href={detailHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-extrabold text-white hover:bg-brand-700">Pilih opsi</Link>;
  return <button type="button" onClick={async()=>{await addItem(event,{variantId:item.variantId,name:item.name,price:item.price,quantity:1,image:item.image,colors:item.colors});}} disabled={item.quotaRemaining<=0} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-extrabold text-white hover:bg-brand-700 disabled:bg-sand-200 disabled:text-sand-500">{item.quotaRemaining>0?"+ Keranjang":"Kuota habis"}</button>;
}
