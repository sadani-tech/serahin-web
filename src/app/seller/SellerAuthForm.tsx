"use client";

import { useActionState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { activateSellerAction, sellerLoginAction } from "./actions";

export function SellerAuthForm({ mode, token = "" }: { mode: "login" | "activate"; token?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? sellerLoginAction : activateSellerAction, undefined);
  return <form action={action} className="space-y-4">
    {mode === "activate" && <input type="hidden" name="token" value={token} />}
    {mode === "login" && <label className="block text-sm font-bold text-sand-700">Email<input name="email" type="email" required autoComplete="email" className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>}
    <label className="block text-sm font-bold text-sand-700">Kata sandi<input name="password" type="password" required minLength={mode === "activate" ? 10 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>
    {mode === "activate" && <label className="block text-sm font-bold text-sand-700">Ulangi kata sandi<input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" className="mt-1 min-h-11 w-full rounded-xl border border-sand-300 px-3" /></label>}
    <ToastFeedback error={state?.error} />
    <button disabled={pending || (mode === "activate" && !token)} className="min-h-11 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Memproses…" : mode === "login" ? "Masuk sebagai Seller" : "Aktifkan akun Seller"}</button>
  </form>;
}
