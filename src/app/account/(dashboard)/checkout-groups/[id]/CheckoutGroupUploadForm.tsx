"use client";

import { useActionState, useRef, useState } from "react";
import { ToastFeedback } from "@/components/Toast";
import { CopyButton } from "@/components/CopyButton";
import { uploadCheckoutGroupPayment } from "../actions";

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type ManualTransferAccount = {
  id: string;
  accountType: "BANK" | "EWALLET";
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
};

export function CheckoutGroupUploadForm({ checkoutGroupId, manualTransfers }: { checkoutGroupId: string; manualTransfers: ManualTransferAccount[] }) {
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

      {manualTransfers.length > 0 ? (
        <div className="mt-4 rounded-xl bg-brand-50 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-brand-800">Transfer ke rekening Seller</p>
          <div className="mt-2 space-y-2">
            {manualTransfers.map((account) => (
              <div key={account.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                  {account.accountType === "EWALLET" ? "E-wallet" : "Bank"}
                </span>
                <span className="font-semibold text-sand-900">{account.bankName}</span>
                <span className="font-mono font-bold tracking-tight text-sand-900">{account.accountNumber}</span>
                <span className="text-xs text-sand-600">a.n. {account.accountHolderName}</span>
                {account.isPrimary && <span className="text-[10px] font-bold text-brand-700">utama</span>}
                <CopyButton text={account.accountNumber} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">Rekening Seller belum tersedia. Hubungi Seller sebelum melakukan transfer.</p>
      )}

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
