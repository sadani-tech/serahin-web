"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatRupiah } from "@/lib/format";
import { deleteSellerPromotion, saveSellerPromotion } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { WorkspaceDialog } from "@/components/ui/WorkspaceDialog";

export type EligibleEvent = { id: string; title: string; status: string; endsAt: string; promotionId: string | null };
export type Promotion = { id: string; name: string; promoMinQuantity: number; promoDiscountPerUnit: string | number; isActive: boolean; salesEvents: { id: string; title: string; status: string }[] };

export function PromotionsManager({ promotions, events }: { promotions: Promotion[]; events: EligibleEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [eventQuery, setEventQuery] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [draftMinimum, setDraftMinimum] = useState(2);
  const [draftDiscount, setDraftDiscount] = useState("");
  const [examplePrice, setExamplePrice] = useState("200000");
  const [exampleQuantity, setExampleQuantity] = useState(3);
  const [state, action, pending] = useActionState(saveSellerPromotion, undefined);
  const router = useRouter();
  const { confirm } = useConfirm();
  const toast = useToast();
  const selected = promotions.find((promo) => promo.id === selectedId);
  useEffect(() => { if (state?.success) router.refresh(); }, [state?.success, router]);

  function openEditor(promo?: Promotion) {
    setSelectedId(promo?.id ?? null);
    setDraftMinimum(promo?.promoMinQuantity ?? 2);
    setDraftDiscount(String(promo?.promoDiscountPerUnit ?? ""));
    setEventQuery("");
    setSelectedEvents(events.filter((event) => event.promotionId === promo?.id).map((event) => event.id));
    setFormOpen(true);
  }

  const exampleSubtotal = Math.max(0, Number(examplePrice)) * Math.max(0, exampleQuantity);
  const exampleDiscount = exampleQuantity >= draftMinimum ? Math.min(exampleSubtotal, Math.max(0, Number(draftDiscount)) * exampleQuantity) : 0;

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
      <button type="button" onClick={() => openEditor()} className="mt-5 min-h-11 w-full rounded-xl bg-white px-5 text-sm font-extrabold text-brand-700 sm:w-auto">＋ Buat promo baru</button>
    </header>

    {formOpen && <WorkspaceDialog title={selected ? `Ubah ${selected.name}` : "Buat promo"} eyebrow="Pengaturan diskon" wide onClose={() => setFormOpen(false)}>
      <form key={selectedId ?? "new"} action={action} className="space-y-6">
        <input type="hidden" name="id" value={selected?.id ?? ""} />
        {selectedEvents.map((id) => <input key={id} type="hidden" name="salesEventIds" value={id} />)}
        <div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">01 · Aturan promo</p><p className="mt-1 text-sm text-sand-500">Diskon berlaku per unit setelah total unit dalam satu Batch PO mencapai minimum.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-sand-700 sm:col-span-2">Nama promo
            <input name="name" required minLength={2} maxLength={120} defaultValue={selected?.name ?? ""} placeholder="Contoh: Beli 2 hemat 10 ribu" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-sand-700">Minimal unit dalam satu Batch PO
            <input name="promoMinQuantity" type="number" required min={2} step={1} value={draftMinimum} onChange={(event) => setDraftMinimum(Number(event.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-sand-700">Potongan per unit (Rp)
            <span className="mt-1 block"><CurrencyInput name="promoDiscountPerUnit" required value={draftDiscount} onValueChange={setDraftDiscount} placeholder="10.000" /></span>
          </label>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">Simulasi harga</p><p className="mt-1 text-xs text-sand-600">Ubah angka contoh untuk melihat hasil potongan.</p></div><div className="flex gap-2"><label className="text-xs text-sand-600">Harga/unit<input aria-label="Harga contoh per unit" inputMode="numeric" type="number" min="0" value={examplePrice} onChange={(event) => setExamplePrice(event.target.value)} className="mt-1 block w-28 rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm" /></label><label className="text-xs text-sand-600">Unit<input aria-label="Jumlah contoh unit" type="number" min="1" value={exampleQuantity} onChange={(event) => setExampleQuantity(Number(event.target.value))} className="mt-1 block w-16 rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm" /></label></div></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-200 pt-4 text-xs"><div><p className="text-sand-500">Sebelum promo</p><b className="mt-1 block text-sm text-sand-900">{formatRupiah(exampleSubtotal)}</b></div><div><p className="text-sand-500">Potongan</p><b className="mt-1 block text-sm text-rose-700">−{formatRupiah(exampleDiscount)}</b></div><div><p className="text-sand-500">Total</p><b className="mt-1 block text-sm text-brand-800">{formatRupiah(exampleSubtotal - exampleDiscount)}</b></div></div></div>
        <div className="border-t border-sand-100 pt-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-brand-700">02 · Pilih Batch PO</h3>
          <p className="mt-1 text-sm text-sand-500">Promo hanya berlaku pada Batch PO yang dipilih. Satu Batch PO memakai satu promo.</p>
          <input type="search" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Cari Batch PO..." aria-label="Cari Batch PO" className="mt-3 min-h-11 w-full rounded-xl border border-sand-300 px-3 text-sm" />
          <div className="mt-3 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-sand-200 p-2">
            {events.length ? events.filter((event) => event.title.toLocaleLowerCase("id-ID").includes(eventQuery.toLocaleLowerCase("id-ID"))).map((event) => {
              const occupied = !!event.promotionId && event.promotionId !== selected?.id;
              return <label key={event.id} className={`flex min-h-12 items-center gap-3 rounded-lg p-2 text-sm ${occupied ? "bg-sand-50 text-sand-400" : "hover:bg-brand-50"}`}>
                <input type="checkbox" checked={selectedEvents.includes(event.id)} onChange={(change) => setSelectedEvents((current) => change.target.checked ? [...current, event.id] : current.filter((id) => id !== event.id))} disabled={occupied} className="h-5 w-5 accent-brand-600" />
                <span className="min-w-0 flex-1"><span className="block truncate font-bold">{event.title}</span><span className="text-xs">{event.status}{occupied ? " · Memakai promo lain" : ""}</span></span>
              </label>;
            }) : <p className="text-sm text-sand-500">Belum ada Batch PO milik toko ini.</p>}
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-sand-200 p-4 text-sm font-bold text-sand-700"><input type="checkbox" name="isActive" defaultChecked={selected?.isActive ?? true} className="h-5 w-5 accent-brand-600" /><span>Promo aktif<span className="block text-xs font-normal text-sand-500">Nonaktifkan untuk menghentikan diskon pada pesanan baru.</span></span></label>
        <p className="text-xs text-sand-500">Pesanan yang sudah dibuat tetap memakai harga saat checkout.</p>
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-sand-100 bg-white px-5 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:-mx-7 sm:px-7"><button type="button" onClick={() => setFormOpen(false)} className="min-h-11 flex-1 rounded-xl border border-sand-300 px-4 text-sm font-bold sm:flex-none">Batal</button><button disabled={pending} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60 sm:flex-none">{pending ? "Menyimpan…" : selected ? "Simpan perubahan" : "Buat promo"}</button></div>
      </form>
    </WorkspaceDialog>}

    <section className="order-2 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-extrabold text-sand-900">Promo tersimpan</h2><p className="text-sm text-sand-500">Atur aturan diskon dan Batch PO yang mendapatkannya.</p></div><p className="text-sm font-bold text-brand-700">{promotions.filter((promo) => promo.isActive).length} aktif · {promotions.length} total</p></div>
      {promotions.length ? promotions.map((promo) => <div key={promo.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:border-brand-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex items-center gap-2"><h3 className="font-extrabold text-sand-900">{promo.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${promo.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand-100 text-sand-500"}`}>{promo.isActive ? "Aktif" : "Nonaktif"}</span></div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg bg-sand-50 px-3 py-2 text-sm text-sand-700">Mulai <b>{promo.promoMinQuantity} unit</b></span><span className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800"><b>{formatRupiah(Number(promo.promoDiscountPerUnit))}</b> / unit</span></div>
            <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Berlaku pada {promo.salesEvents.length} Batch PO</p><div className="mt-2 flex flex-wrap gap-1.5">{promo.salesEvents.length ? promo.salesEvents.map((event) => <span key={event.id} className="rounded-full border border-sand-200 bg-white px-2.5 py-1 text-xs font-medium text-sand-700">{event.title}</span>) : <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Pilih Batch PO agar promo berlaku</span>}</div></div>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto"><button type="button" onClick={() => openEditor(promo)} className="min-h-10 rounded-xl border border-brand-300 px-4 text-sm font-bold text-brand-700">Ubah aturan</button><button type="button" onClick={() => void removePromotion(promo)} className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700">Hapus</button></div>
        </div>
      </div>) : <p className="rounded-xl border border-dashed border-sand-200 p-6 text-sm text-sand-500">Belum ada promo. Pilih tombol Buat promo baru untuk memulai.</p>}
    </section>
  </div>;
}
