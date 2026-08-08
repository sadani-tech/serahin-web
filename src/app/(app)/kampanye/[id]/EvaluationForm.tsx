"use client";

import { useActionState, useState } from "react";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { KETEPATAN_LABEL, KUALITAS_LABEL } from "@/lib/vendor";
import { KetepatanWaktu, KesesuaianKualitas } from "@/lib/types";
import { saveEvaluation, type VendorFormState } from "@/app/(app)/vendor/actions";

export function EvaluationForm({
  campaignId,
  initial,
}: {
  campaignId: string;
  initial?: {
    ketepatanWaktu?: KetepatanWaktu;
    jumlahHariTelat?: number | null;
    kesesuaianKualitas?: KesesuaianKualitas;
    rating?: number;
    catatan?: string | null;
  };
}) {
  const action = saveEvaluation.bind(null, campaignId);
  const [state, formAction, pending] = useActionState<VendorFormState, FormData>(
    action,
    undefined,
  );
  const [ketepatan, setKetepatan] = useState<KetepatanWaktu>(
    initial?.ketepatanWaktu ?? "TEPAT_WAKTU",
  );

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <FormError message={state.error} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ketepatan waktu" required>
          <Select
            name="ketepatanWaktu"
            value={ketepatan}
            onChange={(e) => setKetepatan(e.target.value as KetepatanWaktu)}
          >
            {Object.entries(KETEPATAN_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        {ketepatan === "TELAT" && (
          <Field label="Jumlah hari telat">
            <Input
              name="jumlahHariTelat"
              type="number"
              min={0}
              defaultValue={initial?.jumlahHariTelat ?? 0}
            />
          </Field>
        )}
        <Field label="Kesesuaian kualitas" required>
          <Select
            name="kesesuaianKualitas"
            defaultValue={initial?.kesesuaianKualitas ?? "SESUAI"}
          >
            {Object.entries(KUALITAS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rating (1-5)" required>
          <Select name="rating" defaultValue={String(initial?.rating ?? 5)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Textarea
              name="catatan"
              rows={2}
              defaultValue={initial?.catatan ?? ""}
              placeholder="Catatan evaluasi (opsional)"
            />
          </Field>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan evaluasi"}
        </Button>
      </div>
    </form>
  );
}
