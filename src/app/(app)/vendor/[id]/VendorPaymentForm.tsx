"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { createVendorPayment, type VendorPaymentFormState } from "../actions";

export function VendorPaymentForm({
  vendorId,
  campaigns,
}: {
  vendorId: string;
  campaigns: { id: string; namaProduk: string }[];
}) {
  const action = createVendorPayment.bind(null, vendorId);
  const [state, formAction, pending] = useActionState<VendorPaymentFormState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === undefined) {
      const timer = window.setTimeout(() => formRef.current?.reset(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state?.error && <FormError message={state.error} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Batch PO" required>
          <Select name="campaignId" required defaultValue="">
            <option value="" disabled>Pilih Batch PO</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.namaProduk}</option>
            ))}
          </Select>
        </Field>
        <Field label="Jumlah dibayar (Rp)" required>
          <CurrencyInput name="jumlah" required placeholder="0" />
        </Field>
        <Field label="Tanggal bayar" required>
          <Input name="tanggal" type="date" required />
        </Field>
        <Field label="Bukti transfer (opsional)" hint="JPG, PNG, WEBP, atau PDF (maks 5MB)">
          <Input
            name="bukti"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="file:mr-3 file:rounded-md file:border-0 file:bg-sand-100 file:px-3 file:py-1 file:text-sm"
          />
        </Field>
      </div>
      <Field label="Catatan (opsional)">
        <Textarea name="catatan" rows={2} placeholder="Mis. transfer tahap 1 dari 2" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Catat Pembayaran"}
        </Button>
      </div>
    </form>
  );
}
