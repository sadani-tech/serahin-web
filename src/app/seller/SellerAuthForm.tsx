"use client";

import { useActionState, useState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { Icon } from "@/components/revamp/IconSprite";
import { activateSellerAction, sellerLoginAction } from "./actions";

export function SellerAuthForm({ mode, token = "" }: { mode: "login" | "activate"; token?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? sellerLoginAction : activateSellerAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  return <form action={action} className="space-y-4">
    {mode === "activate" && <input type="hidden" name="token" value={token} />}
    {mode === "login" && (
      <label className="block text-sm font-bold text-sand-700">
        Email
        <span className="relative mt-1.5 block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"><Icon name="mail" className="h-4 w-4" /></span>
          <input name="email" type="email" required autoComplete="email" className="min-h-11 w-full rounded-xl border border-sand-300 py-2.5 pl-10 pr-3.5 font-medium text-sand-900" />
        </span>
      </label>
    )}
    <label className="block text-sm font-bold text-sand-700">
      Kata sandi
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"><Icon name="lock" className="h-4 w-4" /></span>
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          minLength={mode === "activate" ? 10 : 1}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="min-h-11 w-full rounded-xl border border-sand-300 py-2.5 pl-10 pr-10 font-medium text-sand-900"
        />
        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
          <Icon name={showPassword ? "eye-off" : "eye"} className="h-4 w-4" />
        </button>
      </span>
    </label>
    {mode === "activate" && (
      <label className="block text-sm font-bold text-sand-700">
        Ulangi kata sandi
        <span className="relative mt-1.5 block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"><Icon name="lock" className="h-4 w-4" /></span>
          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            required
            minLength={10}
            autoComplete="new-password"
            className="min-h-11 w-full rounded-xl border border-sand-300 py-2.5 pl-10 pr-10 font-medium text-sand-900"
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600" aria-label={showConfirm ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
            <Icon name={showConfirm ? "eye-off" : "eye"} className="h-4 w-4" />
          </button>
        </span>
      </label>
    )}
    <ToastFeedback error={state?.error} />
    <button disabled={pending || (mode === "activate" && !token)} className="min-h-11 w-full rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Memproses…" : mode === "login" ? "Masuk sebagai Seller" : "Aktifkan akun Seller"}</button>
  </form>;
}
