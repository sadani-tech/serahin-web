"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatRupiah } from "@/lib/format";
import { deleteSellerPromotion, saveSellerPromotion } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

export type EligibleEvent = { id: string; title: string; status: string; endsAt: string; promotionId: string | null };
export type Promotion = { id: string; name: string; promoMinQuantity: number; promoDiscountPerUnit: string | number; isActive: boolean; salesEvents: { id: string; title: string; status: string }[] };

export function PromotionsManager({ promotions, events }: { promotions: Promotion[]; events: EligibleEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [state, action, pending] = useActionState(saveSellerPromotion, undefined);
  const router = useRouter();
  const { confirm } = useConfirm();
  const toast = useToast();
  const selected = promotions.find((promo) => promo.id === selectedId);
  useEffect(() => { if (state?.success) router.refresh(); }, [state?.success, router]);

  async function removePromotion(promo: Promotion) {
    if (!await confirm({ title: `Hapus promo ${promo.name}?`, description: "Batch PO terkait tidak lagi mendapat diskon untuk pesanan baru.", confirmLabel: "Hapus" })) return;
    const form = new FormData(); form.set("id", promo.id);
    try { await deleteSellerPromotion(form); toast.success("Promo dihapus."); router.refresh(); }
    catch { toast.error("Promo gagal dihapus. Coba lagi."); }
  }

  return <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-8">
    <header className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-100">Seller</p>
      <h1 className="mt-2 text-3xl font-extrabold">Promo</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Buat beberapa promo, lalu pilih Batch PO yang mendapatkannya. Diskon otomatis dihitung saat syarat jumlah unit tercapai.</p>
      <button type="button" onClick={() => { setSelectedId(null); setFormOpen(true); requestAnimationFrame(() => document.getElementById("promotion-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="mt-5 min-h-11 w-full rounded-xl bg-white px-5 text-sm font-extrabold text-brand-700 sm:w-auto">＋ Buat promo baru</button>
    </header>

    {formOpen && <section id="promotion-editor" className="order-1 scroll-mt-5 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-sand-900">{selected ? `Ubah ${selected.name}` : "Buat promo"}</h2>
        <button type="button" onClick={() => { setSelectedId(null); setFormOpen(false); }} className="min-h-10 rounded-xl border border-sand-300 px-3 text-sm font-bold text-sand-600">Tutup</button>
      </div>
      <form key={selectedId ?? "new"} action={action} className="mt-5 space-y-5">
        <input type="hidden" name="id" value={selected?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-sand-700">Nama promo
            <input name="name" required minLength={2} maxLength={120} defaultValue={selected?.name ?? ""} placeholder="Contoh: Beli 2 hemat 10 ribu" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-sand-700">Minimal unit dalam satu PO
            <input name="promoMinQuantity" type="number" required min={2} step={1} defaultValue={selected?.promoMinQuantity ?? 2} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-sand-700">Potongan per unit (Rp)
            <span className="mt-1 block"><CurrencyInput key={selected?.id ?? "new"} name="promoDiscountPerUnit" required defaultValue={selected?.promoDiscountPerUnit ?? ""} placeholder="10.000" /></span>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-sand-700"><input type="checkbox" name="isActive" defaultChecked={selected?.isActive ?? true} className="h-4 w-4 accent-brand-600" /> Promo aktif</label>
        <div>
          <h3 className="text-sm font-extrabold text-sand-900">Terapkan ke Batch PO</h3>
          <p className="mt-1 text-xs text-sand-500">Pilih satu atau beberapa. Batch PO tanpa pilihan tidak mendapat promo. Lepaskan promo lama sebelum memindahkan Batch PO ke promo lain.</p>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-sand-200 p-3">
            {events.length ? events.map((event) => {
              const occupied = !!event.promotionId && event.promotionId !== selected?.id;
              return <label key={event.id} className={`flex items-start gap-3 rounded-lg p-2 text-sm ${occupied ? "bg-sand-50 text-sand-400" : "hover:bg-brand-50"}`}>
                <input type="checkbox" name="salesEventIds" value={event.id} defaultChecked={event.promotionId === selected?.id} disabled={occupied} className="mt-0.5 h-4 w-4 accent-brand-600" />
                <span><span className="font-bold">{event.title}</span><span className="ml-2 text-xs">{event.status}{occupied ? " · Memakai promo lain" : ""}</span></span>
              </label>;
            }) : <p className="text-sm text-sand-500">Belum ada Batch PO milik toko ini.</p>}
          </div>
        </div>
        <p className="text-xs text-sand-500">Contoh: minimum 2 unit dan diskon Rp10.000 per unit membuat 3 produk seharga Rp200.000 menjadi Rp570.000. Pesanan yang sudah dibuat tetap memakai harga saat checkout.</p>
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
        <button disabled={pending} className="min-h-11 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto">{pending ? "Menyimpan…" : selected ? "Simpan perubahan" : "Buat promo"}</button>
      </form>
    </section>}

    <section className="order-2 space-y-3">
      <h2 className="text-lg font-extrabold text-sand-900">Promo tersimpan ({promotions.length})</h2>
      {promotions.length ? promotions.map((promo) => <div key={promo.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:border-brand-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex items-center gap-2"><h3 className="font-extrabold text-sand-900">{promo.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${promo.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand-100 text-sand-500"}`}>{promo.isActive ? "Aktif" : "Nonaktif"}</span></div>
            <p className="mt-1 text-sm text-sand-600">Minimal {promo.promoMinQuantity} unit · Potongan {formatRupiah(Number(promo.promoDiscountPerUnit))} per unit</p>
            <p className="mt-1 text-xs text-sand-500">{promo.salesEvents.length ? promo.salesEvents.map((event) => event.title).join(", ") : "Belum diterapkan pada Batch PO"}</p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto"><button type="button" onClick={() => { setSelectedId(promo.id); setFormOpen(true); requestAnimationFrame(() => document.getElementById("promotion-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="min-h-10 rounded-xl border border-brand-300 px-4 text-sm font-bold text-brand-700">Ubah</button><button type="button" onClick={() => void removePromotion(promo)} className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700">Hapus</button></div>
        </div>
      </div>) : <p className="rounded-xl border border-dashed border-sand-200 p-6 text-sm text-sand-500">Belum ada promo. Pilih tombol Buat promo baru untuk memulai.</p>}
    </section>
  </div>;
}
