"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CatalogQuickAdd({ detailHref, event, item }: {
  detailHref: string;
  event: { salesEventId: string; eventTitle: string; formToken: string; sellerName: string; endsAt: string };
  item: { variantId: string; name: string; price: number; image?: string | null; colors?: string[]; quotaRemaining: number };
}) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  if (item.colors?.length) return <Link href={detailHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-extrabold text-white hover:bg-brand-700">Pilih opsi</Link>;
  return <div className="flex flex-1 flex-col"><button type="button" onClick={async()=>{const ok=await addItem(event,{variantId:item.variantId,name:item.name,price:item.price,quantity:1,image:item.image,colors:item.colors});if(ok)setMessage("Ditambahkan");}} disabled={item.quotaRemaining<=0} className="min-h-11 rounded-xl bg-brand-600 px-3 text-sm font-extrabold text-white hover:bg-brand-700 disabled:bg-sand-200 disabled:text-sand-500">{item.quotaRemaining>0?"+ Keranjang":"Kuota habis"}</button>{message&&<Link href="/cart" className="mt-1 text-center text-xs font-bold text-brand-700 underline">{message} · buka</Link>}</div>;
}
