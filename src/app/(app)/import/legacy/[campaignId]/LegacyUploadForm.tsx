"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/domain";
import { uploadLegacy } from "../../legacy-actions";
import { type ImportUploadState } from "../../constants";

export function LegacyUploadForm({ campaignId }: { campaignId: string }) {
  const action = uploadLegacy.bind(null, campaignId);
  const [state, formAction, pending] = useActionState<
    ImportUploadState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <FormError message={state.error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nominal DP flat (Rp)"
          required
          hint="Diterapkan ke setiap baris (sumber tak punya nominal). FR-2.2"
        >
          <Input name="dpNominal" type="number" min={1} step={1000} defaultValue={100000} required />
        </Field>
        <Field label="Status pesanan default" required>
          <Select name="defaultStatus" defaultValue="DP_DITERIMA" required>
            {ORDER_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Status verifikasi pembayaran"
          hint="Bukti historis biasanya langsung terverifikasi (open Q#1)."
        >
          <Select name="verifikasi" defaultValue="TERVERIFIKASI">
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
          </Select>
        </Field>
      </div>

      <Field
        label="File mentah (.xlsx / .csv)"
        required
        hint="4 kolom: Timestamp, Nama - Nomor Whatsapp, Pesanan - Qty, Bukti DP."
      >
        <Input
          name="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Memproses…" : "Parse & Pratinjau"}
      </Button>
    </form>
  );
}
