"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import type { BuyerActionState } from "@/lib/buyer-auth-actions";
import { ToastFeedback } from "@/components/Toast";
import { Icon } from "@/components/revamp/IconSprite";

type Action = (state: BuyerActionState, form: FormData) => Promise<BuyerActionState>;
type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string; minLength?: number; placeholder?: string };

/** Ikon prefix per tipe field (lihat Icon di @/components/revamp/IconSprite). */
const FIELD_ICON: Partial<Record<string, string>> = { email: "mail", tel: "phone" };

export function AuthForm({ action, fields, hidden, submit, secondaryAction, footer, success, social }: { action: Action; fields: Field[]; hidden?: Record<string, string>; submit: string; /** Link kecil di bawah tombol submit, mis. "Lupa kata sandi?" */ secondaryAction?: { href: string; label: string }; footer?: { href: string; label: string }; success?: { title: string; copy: string }; social?: ReactNode }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  function togglePassword(name: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (state?.message && success) return <div role="status" className="space-y-5 text-center">
    <ToastFeedback success={state.message} />
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div>
    <div><h2 className="text-lg font-extrabold text-sand-900">{success.title}</h2></div>
    <div className="rounded-2xl border-2 border-accent-300 bg-accent-50 p-4 text-left">
      <div className="flex items-center gap-2 text-accent-800">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path d="M4 4h16v16H4z" /><path d="m22 6-10 7L2 6" />
        </svg>
        <p className="text-xs font-extrabold uppercase tracking-wide">Langkah berikutnya: buka email Anda</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-sand-700">{success.copy}</p>
      <p className="mt-2 text-xs leading-5 text-sand-500">Tidak masuk dalam beberapa menit? Cek folder Spam/Promosi. Masuk baru bisa dilakukan setelah email ini diaktifkan.</p>
    </div>
    <Link href="/account/login" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-sand-300 bg-white px-4 text-sm font-extrabold text-sand-700 hover:bg-sand-50">Sudah aktivasi? Masuk di sini</Link>
  </div>;
  return <><form action={formAction} className="space-y-4">
    {hidden && Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    <ToastFeedback error={state?.error} success={state?.message} />
    {fields.map((field) => {
      if (field.type === "checkbox") return (
        <label key={field.name} className="flex gap-3 text-sm font-bold leading-5 text-sand-700">
          <input name={field.name} type="checkbox" required={field.required ?? false} className="mt-1 h-4 w-4" />
          <span>{field.label}</span>
        </label>
      );
      const isPassword = field.type === "password";
      const prefixIcon = isPassword ? "lock" : FIELD_ICON[field.type ?? "text"];
      const shown = visiblePasswords.has(field.name);
      return (
        <label key={field.name} className="block text-sm font-bold text-sand-700">
          {field.label}
          <span className="relative mt-1.5 block">
            {prefixIcon && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400">
                <Icon name={prefixIcon} className="h-4 w-4" />
              </span>
            )}
            <input
              name={field.name}
              type={isPassword ? (shown ? "text" : "password") : (field.type ?? "text")}
              autoComplete={field.autoComplete}
              defaultValue={field.defaultValue}
              required={field.required ?? true}
              minLength={field.minLength}
              placeholder={field.placeholder}
              className={`min-h-11 w-full rounded-xl border border-sand-300 py-2.5 font-medium text-sand-900 ${prefixIcon ? "pl-10" : "pl-3.5"} ${isPassword ? "pr-10" : "pr-3.5"}`}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => togglePassword(field.name)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                <Icon name={shown ? "eye-off" : "eye"} className="h-4 w-4" />
              </button>
            )}
          </span>
        </label>
      );
    })}
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Memproses…" : submit}</button>
    {secondaryAction && <p className="text-center text-sm"><Link className="font-bold text-brand-700 hover:underline" href={secondaryAction.href}>{secondaryAction.label}</Link></p>}
    {footer && <p className="text-center text-sm text-sand-600"><Link className="font-bold text-brand-700 hover:underline" href={footer.href}>{footer.label}</Link></p>}
  </form>{social}</>;
}
