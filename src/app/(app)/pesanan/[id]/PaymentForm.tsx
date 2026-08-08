"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain";
import { PaymentScheme } from "@/generated/prisma";
import { addPayment, type PaymentFormState } from "../actions";

export function PaymentForm({
  orderId,
  scheme,
  sisaDp,
  sisaTotal,
}: {
  orderId: string;
  scheme: PaymentScheme;
  sisaDp: number;
  sisaTotal: number;
}) {
  const action = addPayment.bind(null, orderId);
  const [state, formAction, pending] = useActionState<
    PaymentFormState,
    FormData
  >(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form setelah sukses (state kembali undefined tanpa error).
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  const jenisOptions =
    scheme === "LUNAS"
      ? (["LUNAS"] as const)
      : (["DP", "PELUNASAN"] as const);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state?.error && <FormError message={state.error} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Jenis" required>
          <Select name="jenis" required defaultValue={jenisOptions[0]}>
            {jenisOptions.map((j) => (
              <option key={j} value={j}>
                {PAYMENT_TYPE_LABEL[j]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Jumlah (Rp)"
          required
          hint={
            scheme === "DP_PELUNASAN"
              ? `Saran DP: Rp${sisaDp.toLocaleString("id-ID")} · Sisa total: Rp${sisaTotal.toLocaleString("id-ID")}`
              : `Sisa total: Rp${sisaTotal.toLocaleString("id-ID")}`
          }
        >
          <Input name="jumlah" type="number" min={1} step={1000} required />
        </Field>
        <Field label="Tanggal bayar">
          <Input name="tanggal" type="date" />
        </Field>
        <Field label="Bukti transfer" hint="JPG, PNG, WEBP, atau PDF (maks 5MB)">
          <Input
            name="bukti"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Catat pembayaran"}
        </Button>
      </div>
    </form>
  );
}
