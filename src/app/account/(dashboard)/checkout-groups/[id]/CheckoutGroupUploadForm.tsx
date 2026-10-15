"use client";

import { useActionState, useRef, useState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { uploadCheckoutGroupPayment } from "../actions";

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function CheckoutGroupUploadForm({ checkoutGroupId }: { checkoutGroupId: string }) {
  const action = uploadCheckoutGroupPayment.bind(null, checkoutGroupId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (!PROOF_TYPES.includes(file.type)) {
      setLocalError("Format harus JPG, PNG, WEBP, atau PDF.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      setLocalError("Ukuran file maksimal 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-sand-900">Unggah bukti transfer</h2>
      <p className="mt-1 text-sm text-sand-500">Satu bukti transfer untuk seluruh Batch PO pada checkout gabungan ini.</p>
      <ToastFeedback error={state?.error} success={state?.success} />
      {localError && <p className="mt-2 text-sm font-bold text-rose-600">{localError}</p>}
      <form action={formAction} className="mt-4">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="block w-full text-sm text-sand-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-sand-700 hover:file:bg-sand-200"
        />
        <p className="mt-1 text-xs text-sand-500">JPG, PNG, WEBP, atau PDF, maksimal 5 MB.</p>
        <button disabled={pending || !!localError} className="mt-3 min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Mengunggah…" : "Kirim bukti transfer"}
        </button>
      </form>
    </section>
  );
}
