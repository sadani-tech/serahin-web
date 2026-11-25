"use client";

import { useActionState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { updateSellerPromotion } from "./actions";

export function PromotionForm({ minimum, discount }: { minimum: number | null; discount: string | number | null }) {
  const [state, action, pending] = useActionState(updateSellerPromotion, undefined);
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-sand-900">Promo jumlah pembelian</h2>
      <p className="mt-1 text-sm text-sand-500">Jumlah dihitung dari semua produk toko ini dalam satu keranjang Batch PO. Jika minimum tercapai, setiap unit mendapat potongan. Pesanan yang sudah dibuat tetap memakai harga saat checkout.</p>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-sand-700">Minimal pembelian (unit)
          <input name="promoMinQuantity" type="number" min={2} step={1} defaultValue={minimum ?? ""} placeholder="2" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-bold text-sand-700">Potongan per unit (Rp)
          <span className="mt-1 block"><CurrencyInput name="promoDiscountPerUnit" defaultValue={discount ?? ""} placeholder="10.000" /></span>
        </label>
        <p className="text-xs text-sand-500 sm:col-span-2">Contoh: minimal 2 unit, potongan Rp10.000. Tiga produk seharga Rp200.000 per unit menjadi Rp570.000. Kosongkan kedua kolom untuk menonaktifkan promo.</p>
        {state?.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
        {state?.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">{state.success}</p>}
        <div className="sm:col-span-2"><button disabled={pending} className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60">{pending ? "Menyimpan…" : "Simpan promo"}</button></div>
      </form>
    </section>
  );
}
