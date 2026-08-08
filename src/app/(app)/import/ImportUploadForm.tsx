"use client";

import { useActionState, useState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { uploadImport } from "./actions";
import { type ImportUploadState } from "./constants";

export function ImportUploadForm({
  mode,
  campaigns,
  fixedCampaignId,
}: {
  mode: "KAMPANYE_PENUH" | "PESANAN";
  campaigns?: { id: string; namaProduk: string }[];
  fixedCampaignId?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ImportUploadState,
    FormData
  >(uploadImport, undefined);
  const [campaignId, setCampaignId] = useState(fixedCampaignId ?? "");

  const templateHref =
    mode === "KAMPANYE_PENUH"
      ? "/api/import/template?mode=A"
      : campaignId
        ? `/api/import/template?mode=B&campaign=${campaignId}`
        : null;

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <FormError message={state.error} />}
      <input type="hidden" name="mode" value={mode} />

      {mode === "PESANAN" && !fixedCampaignId && (
        <Field label="Kampanye tujuan" required>
          <Select
            name="targetCampaignId"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            required
          >
            <option value="">— pilih kampanye —</option>
            {campaigns?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namaProduk}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {mode === "PESANAN" && fixedCampaignId && (
        <input type="hidden" name="targetCampaignId" value={fixedCampaignId} />
      )}

      <div>
        <a
          href={templateHref ?? "#"}
          className={`text-sm font-medium ${
            templateHref
              ? "text-slate-900 underline hover:text-slate-700"
              : "cursor-not-allowed text-slate-400"
          }`}
          aria-disabled={!templateHref}
        >
          ↓ Unduh template {mode === "KAMPANYE_PENUH" ? "Mode A (4 sheet)" : "Mode B (2 sheet)"}
        </a>
        {mode === "PESANAN" && !campaignId && !fixedCampaignId && (
          <p className="mt-1 text-xs text-slate-400">
            Pilih kampanye dulu untuk mengunduh template.
          </p>
        )}
      </div>

      <Field label="File terisi (.xlsx / .csv)" required>
        <Input
          name="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          className="file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Mengunggah…" : "Unggah & Pratinjau"}
      </Button>
    </form>
  );
}
