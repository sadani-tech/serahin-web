"use client";

import { useActionState } from "react";
import { Button, Card, Field, FormError, Input, Textarea } from "@/components/ui";
import type { VendorFormState } from "./actions";

export function VendorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: VendorFormState,
    formData: FormData,
  ) => Promise<VendorFormState>;
  initial?: {
    nama?: string;
    kontak?: string;
    spesialisasi?: string;
    catatanUmum?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama vendor" required>
            <Input name="nama" defaultValue={initial?.nama} required placeholder="mis. Konveksi Jaya" />
          </Field>
          <Field label="Kontak">
            <Input name="kontak" defaultValue={initial?.kontak} placeholder="No. WA / email" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Spesialisasi">
              <Input
                name="spesialisasi"
                defaultValue={initial?.spesialisasi}
                placeholder="mis. Kaos & jaket sablon"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Catatan umum">
              <Textarea
                name="catatanUmum"
                defaultValue={initial?.catatanUmum}
                rows={3}
                placeholder="Catatan bebas tentang vendor ini"
              />
            </Field>
          </div>
        </div>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
