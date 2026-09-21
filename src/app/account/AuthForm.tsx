"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ReactNode } from "react";
import type { BuyerActionState } from "@/lib/buyer-auth-actions";
import { ToastFeedback } from "@/components/Toast";

type Action = (state: BuyerActionState, form: FormData) => Promise<BuyerActionState>;
type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string };

export function AuthForm({ action, fields, hidden, submit, footer, success, social }: { action: Action; fields: Field[]; hidden?: Record<string, string>; submit: string; footer?: { href: string; label: string }; success?: { title: string; copy: string }; social?: ReactNode }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  if (state?.message && success) return <div role="status" className="space-y-5 text-center"><ToastFeedback success={state.message} /><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div><div><h2 className="text-lg font-extrabold text-sand-900">{success.title}</h2><p className="mt-2 text-sm leading-6 text-sand-600">{success.copy}</p></div><Link href="/account/login" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white">Kembali ke halaman masuk</Link></div>;
  return <><form action={formAction} className="space-y-4">
    {hidden && Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    <ToastFeedback error={state?.error} success={state?.message} />
    {fields.map((field) => field.type === "checkbox"
      ? <label key={field.name} className="flex gap-3 text-sm font-bold leading-5 text-sand-700"><input name={field.name} type="checkbox" required={field.required ?? false} className="mt-1 h-4 w-4" /><span>{field.label}</span></label>
      : <label key={field.name} className="block text-sm font-bold text-sand-700">{field.label}
        <input name={field.name} type={field.type ?? "text"} autoComplete={field.autoComplete} defaultValue={field.defaultValue} required={field.required ?? true} className="mt-1.5 min-h-11 w-full rounded-xl border border-sand-300 px-3 font-medium" />
      </label>)}
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Memproses…" : submit}</button>
    {footer && <p className="text-center text-sm text-sand-600"><Link className="font-bold text-brand-700 hover:underline" href={footer.href}>{footer.label}</Link></p>}
  </form>{social}</>;
}
