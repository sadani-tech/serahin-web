"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { submitFeedback } from "./actions";

export function KritikSaranForm() {
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
  );
}
