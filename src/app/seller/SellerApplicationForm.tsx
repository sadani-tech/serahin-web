"use client";

import { useActionState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { applySellerAction } from "./actions";

export function SellerApplicationForm() {
  const [state, action, pending] = useActionState(applySellerAction, undefined);
  return <form action={action} className="mt-6 grid gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:grid-cols-2">
    <label className="text-sm font-bold text-sand-700">Nama bisnis<input name="businessName" required minLength={2} maxLength={160} className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>
    <label className="text-sm font-bold text-sand-700">Email bisnis<input name="contactEmail" required type="email" className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>
    <label className="text-sm font-bold text-sand-700">Nomor kontak<input name="contactPhone" required minLength={6} maxLength={40} className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>
    <label className="text-sm font-bold text-sand-700">URL logo (opsional)<input name="logoUrl" type="url" className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>
    <label className="text-sm font-bold text-sand-700 sm:col-span-2">Deskripsi bisnis<textarea name="description" required minLength={20} maxLength={3000} rows={5} className="mt-1 w-full rounded-xl border border-sand-300 px-3 py-2" /></label>
    <ToastFeedback error={state?.error} success={state?.success} />
    <button disabled={pending} className="min-h-11 rounded-xl bg-brand-700 px-5 font-extrabold text-white sm:col-span-2">{pending ? "Mengirim…" : "Kirim pengajuan Seller"}</button>
  </form>;
}
