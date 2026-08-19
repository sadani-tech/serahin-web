"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FileUploadField } from "@/components/FileUploadField";
import { formatRupiah } from "@/lib/format";
import { submitPortalPayment, type PortalPaymentState } from "../actions";

// Form pelunasan/pembayaran mandiri pembeli di portal. Ditampilkan hanya bila
// masih ada sisa tagihan & tidak ada pembayaran yang menunggu verifikasi.
export function PortalPaymentForm({
  token,
  sisa,
  isPelunasan,
}: {
  token: string;
  sisa: number;
  isPelunasan: boolean;
}) {
  const action = submitPortalPayment.bind(null, token);
  const [state, formAction, pending] = useActionState<
    PortalPaymentState,
    FormData
  >(action, undefined);
  const [jumlah, setJumlah] = useState(String(sisa));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("jumlahBayar", jumlah);
    startTransition(() => formAction(fd));
  }

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
        Pembayaran Anda terkirim dan sedang menunggu verifikasi Admin. Status
        akan diperbarui setelah diverifikasi.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {state?.error && <FormError message={state.error} />}

      <Field
        label="Jumlah yang ditransfer"
        required
        hint={
          jumlah
            ? `= ${formatRupiah(Number(jumlah))}`
            : "Nominal sesuai bukti transfer."
        }
      >
        <CurrencyInput
          name="jumlahBayar"
          required
          value={jumlah}
          onValueChange={setJumlah}
          placeholder="0"
        />
      </Field>

      <FileUploadField
        name="bukti"
        label="Bukti transfer"
        hint="JPG, PNG, WEBP, atau PDF (maks 5MB)."
        required
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Mengirim…"
          : isPelunasan
            ? "Kirim pelunasan"
            : "Kirim pembayaran"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Pembayaran akan diverifikasi Admin terlebih dahulu.
      </p>
    </form>
  );
}
