"use client";

import { useActionState, useState } from "react";
import { useRef, useEffect } from "react";
import { ToastFeedback } from "@/components/Toast";
import { Icon } from "@/components/revamp/IconSprite";
import { changePasswordSellerAction } from "./actions";

function PasswordField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block text-sm font-bold text-sand-700">
      {label}
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"><Icon name="lock" className="h-4 w-4" /></span>
        <input
          name={name}
          type={shown ? "text" : "password"}
          required
          minLength={name === "currentPassword" ? 1 : 10}
          autoComplete={autoComplete}
          className="min-h-11 w-full rounded-xl border border-sand-300 py-2.5 pl-10 pr-10 font-medium text-sand-900"
        />
        <button type="button" onClick={() => setShown((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600" aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
          <Icon name={shown ? "eye-off" : "eye"} className="h-4 w-4" />
        </button>
      </span>
    </label>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordSellerAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-sand-900">Ganti kata sandi</h2>
      <p className="mt-1 text-sm text-sand-500">Mengganti kata sandi akan mencabut sesi login Seller di perangkat lain.</p>
      <form ref={formRef} action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PasswordField name="currentPassword" label="Kata sandi saat ini" autoComplete="current-password" />
        </div>
        <PasswordField name="newPassword" label="Kata sandi baru (min. 10 karakter)" autoComplete="new-password" />
        <PasswordField name="confirmPassword" label="Ulangi kata sandi baru" autoComplete="new-password" />
        <div className="sm:col-span-2">
          <ToastFeedback error={state?.error} success={state?.success} />
        </div>
        <div className="sm:col-span-2">
          <button disabled={pending} className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Menyimpan…" : "Simpan kata sandi baru"}
          </button>
        </div>
      </form>
    </section>
  );
}
