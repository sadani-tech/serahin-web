"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Textarea } from "@/components/ui";
import {
  requestDataDeletion,
  withdrawCommunicationConsent,
} from "./actions";

export function DataDeletionForm() {
  const [state, action, pending] = useActionState(requestDataDeletion, undefined);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-200">
        <p className="font-extrabold text-brand-800">Permintaan diterima</p>
        <p className="mt-2 text-sm text-brand-700">{state.message}</p>
        <p className="mt-2 text-sm font-bold text-brand-800">
          Referensi: {state.reference}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="not-prose mt-6 space-y-4 rounded-2xl border border-sand-200 bg-cream-soft p-5">
      {state?.error && <FormError message={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email yang digunakan">
          <Input name="email" type="email" maxLength={254} autoComplete="email" />
        </Field>
        <Field label="Nomor WhatsApp">
          <Input name="phone" type="tel" maxLength={32} autoComplete="tel" />
        </Field>
      </div>
      <Field label="Referensi/token pesanan" hint="Opsional, bila masih tersedia.">
        <Input name="orderReference" maxLength={160} />
      </Field>
      <Field label="Data yang ingin dihapus" required>
        <Textarea name="reason" minLength={5} maxLength={2000} rows={5} required />
      </Field>
      <label className="sr-only" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="text-xs leading-5 text-sand-500">
        Isi minimal email atau WhatsApp. Kami akan memverifikasi identitas sebelum
        mengubah data dan tidak akan meminta PIN maupun OTP.
      </p>
      <Button type="submit" loading={pending}>
        Kirim permintaan
      </Button>
    </form>
  );
}

export function CommunicationPreferenceForm() {
  const [state, action, pending] = useActionState(
    withdrawCommunicationConsent,
    undefined,
  );

  return (
    <form action={action} className="not-prose mt-6 space-y-4 rounded-2xl border border-sand-200 bg-cream-soft p-5">
      {state?.ok ? (
        <p role="status" className="rounded-xl bg-brand-50 p-3 text-sm font-bold text-brand-800">
          {state.message}
        </p>
      ) : state?.error ? (
        <FormError message={state.error} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor WhatsApp" required>
          <Input name="phone" type="tel" minLength={8} maxLength={32} autoComplete="tel" required />
        </Field>
        <Field label="Token portal pesanan" required>
          <Input name="orderReference" minLength={20} maxLength={160} required />
        </Field>
      </div>
      <p className="text-xs leading-5 text-sand-500">
        Token terdapat pada tautan portal pesanan setelah bagian <strong>/portal/</strong>.
        Respons dibuat generik agar data pesanan tidak dapat ditebak pihak lain.
      </p>
      <Button type="submit" loading={pending}>
        Tarik persetujuan WhatsApp
      </Button>
    </form>
  );
}
