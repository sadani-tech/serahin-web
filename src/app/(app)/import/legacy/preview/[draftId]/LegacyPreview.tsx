"use client";

import { useActionState, useMemo, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button, FormError } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { confirmLegacy, type LegacyConfirmState } from "../../../legacy-actions";

export type LegacyPreviewRow = {
  index: number;
  rawNamaNomor: string;
  rawPesananQty: string;
  rawBukti: string;
  nama: string;
  kontak: string;
  varianInput: string;
  variantId: string | null;
  jumlah: number;
  needsManualVarian: boolean;
  dataBelumLengkap: boolean;
};

export function LegacyPreview({
  draftId,
  rows,
  variants,
  dpNominal,
  defaultStatusLabel,
}: {
  draftId: string;
  rows: LegacyPreviewRow[];
  variants: { id: string; nama: string }[];
  dpNominal: number;
  defaultStatusLabel: string;
}) {
  const action = confirmLegacy.bind(null, draftId);
  const [state, formAction, pending] = useActionState<
    LegacyConfirmState,
    FormData
  >(action, undefined);
  useOverlayWhilePending(pending);

  const variantNama = useMemo(
    () => new Map(variants.map((v) => [v.id, v.nama])),
    [variants],
  );

  const manualRows = rows.filter((r) => r.needsManualVarian);
  const [resolusi, setResolusi] = useState<Record<number, string>>({});
  const semuaManualTerisi = manualRows.every((r) => resolusi[r.index]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <FormError message={state.error} />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          {rows.length} baris · DP flat {formatRupiah(dpNominal)} · status{" "}
          {defaultStatusLabel}
          {manualRows.length > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-amber-600">
                {manualRows.length} baris butuh pilih varian
              </span>
            </>
          )}
        </p>
        <Button type="submit" disabled={pending || !semuaManualTerisi}>
          {pending ? "Memproses…" : "Konfirmasi Import"}
        </Button>
      </div>
      {!semuaManualTerisi && (
        <p className="text-xs text-amber-600">
          Lengkapi pilihan varian pada baris yang disorot (atau pilih “Lewati”)
          sebelum konfirmasi.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Data mentah</th>
              <th className="px-3 py-2 font-medium">Nama</th>
              <th className="px-3 py-2 font-medium">Kontak</th>
              <th className="px-3 py-2 font-medium">Varian (hasil)</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Bukti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.index} className={r.needsManualVarian ? "bg-amber-50" : ""}>
                <td className="px-3 py-2 align-top text-xs text-slate-500">
                  <div>{r.rawNamaNomor || "—"}</div>
                  <div>{r.rawPesananQty || "—"}</div>
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {r.nama || (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                      kosong
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {r.kontak || (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                      kosong
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  {r.needsManualVarian ? (
                    <select
                      name={`varian_${r.index}`}
                      value={resolusi[r.index] ?? ""}
                      onChange={(e) =>
                        setResolusi((s) => ({ ...s, [r.index]: e.target.value }))
                      }
                      className="rounded-lg border border-amber-300 px-2 py-1 text-sm"
                    >
                      <option value="">— pilih varian —</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nama}
                        </option>
                      ))}
                      <option value="SKIP">Lewati baris ini</option>
                    </select>
                  ) : (
                    <span className="text-slate-700">
                      {variantNama.get(r.variantId ?? "") ?? r.varianInput}
                    </span>
                  )}
                  {r.varianInput && r.needsManualVarian && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      teks: “{r.varianInput}”
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">{r.jumlah}</td>
                <td className="px-3 py-2 align-top">
                  {r.rawBukti ? (
                    <a
                      href={r.rawBukti}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-600 underline"
                    >
                      link
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
