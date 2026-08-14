"use client";

import { useState, useTransition } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button } from "@/components/ui";
import { toggleFormAktif } from "../actions";

export function FormPublikControl({
  campaignId,
  formToken,
  aktif,
  bisaAktif,
}: {
  campaignId: string;
  formToken: string;
  aktif: boolean;
  bisaAktif: boolean; // kampanye masih Open
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  useOverlayWhilePending(pending);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/po/${formToken}`
      : `/po/${formToken}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* salin manual */
    }
  }

  const efektifAktif = aktif && bisaAktif;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Formulir PO publik
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            efektifAktif
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {efektifAktif ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {!bisaAktif && (
        <p className="text-xs text-slate-500">
          Form otomatis nonaktif karena kampanye tidak lagi berstatus Open.
        </p>
      )}

      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700"
        />
        <Button type="button" variant="secondary" onClick={copy}>
          {copied ? "Tersalin ✓" : "Salin"}
        </Button>
      </div>

      {bisaAktif && (
        <Button
          type="button"
          variant={aktif ? "danger" : "primary"}
          className="w-full"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              toggleFormAktif(campaignId, !aktif);
            })
          }
        >
          {pending
            ? "Menyimpan…"
            : aktif
              ? "Nonaktifkan form"
              : "Aktifkan form"}
        </Button>
      )}
    </div>
  );
}
