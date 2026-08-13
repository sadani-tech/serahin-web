"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain";
import { PaymentScheme } from "@/lib/types";
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
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // Reset form setelah sukses (state kembali undefined tanpa error).
  useEffect(() => {
    if (state === undefined) {
      formRef.current?.reset();
      setPreview(null);
      setFileName("");
    }
  }, [state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (maks 5MB)");
        e.target.value = "";
        setPreview(null);
        setFileName("");
        return;
      }
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
      setFileName("");
    }
  };

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
        <Field label="Bukti transfer" required hint="JPG, PNG, WEBP, atau PDF (maks 5MB)">
          <Input
            name="bukti"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            required
            className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
          />
          {preview ? (
            <div className="mt-2 space-y-1">
              {!fileName.toLowerCase().endsWith(".pdf") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Pratinjau bukti"
                  className="max-h-48 rounded-lg border border-slate-200"
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  📄 {fileName}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFileName("");
                  const fileInput = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
                  if (fileInput) fileInput.value = "";
                }}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                Hapus
              </button>
            </div>
          ) : null}
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
