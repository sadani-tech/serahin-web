"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { submitFeedback } from "./actions";

export default function KritikSaranPage() {
  const [state, formAction] = useActionState(submitFeedback, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state?.success) {
      toast.success("Terima kasih! Masukan kamu sudah terkirim ke tim Serahin.");
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Bantuan</p>
        <h1 className="mt-1 text-3xl font-extrabold text-sand-900">Kritik &amp; Saran</h1>
        <p className="mt-2 text-sm text-sand-600">
          Ada fitur yang membingungkan, error, atau ide perbaikan? Tulis di sini — masukan kamu langsung masuk ke
          tim internal Serahin, bukan ke Buyer atau Seller lain.
        </p>
      </header>

      <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
        {state?.error && <FormError message={state.error} />}
        <label className="block text-sm font-bold text-sand-700">
          Kritik / Saran
          <Textarea
            name="message"
            rows={6}
            required
            minLength={5}
            maxLength={4000}
            placeholder="Ceritakan detailnya — mis. halaman mana, langkah apa yang kamu lakukan, dan apa yang kamu harapkan terjadi."
            className="mt-1"
          />
        </label>
        <div className="flex justify-end">
          <SubmitButton loadingText="Mengirim…">Kirim</SubmitButton>
        </div>
      </form>
    </div>
  );
}
