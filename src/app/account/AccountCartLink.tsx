"use client";

import Link from "next/link";
import { CartIcon } from "@/components/brand";
import { useCart } from "@/components/CartProvider";

export function AccountCartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sand-700 hover:bg-brand-50 hover:text-brand-700"
      aria-label={`Keranjang, ${count} item`}
      title="Keranjang"
    >
      <CartIcon className="h-6 w-6 text-brand-700" />
      {count > 0 && <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-[11px] text-white">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
