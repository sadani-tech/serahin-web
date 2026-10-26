"use client";

import Link from "next/link";
import { CartIcon } from "@/components/brand";
import { useCart } from "@/components/CartProvider";

export function AccountCartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition hover:scale-105 hover:bg-brand-100"
      aria-label={`Keranjang, ${count} item`}
      title="Keranjang"
    >
      <CartIcon className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full border-2 border-white bg-accent-600 px-1 py-0.5 text-[10px] font-extrabold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
