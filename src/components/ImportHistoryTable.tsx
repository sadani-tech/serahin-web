"use client"

import { useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { formatWaktu } from "@/lib/format";
import { IMPORT_MODE_LABEL, IMPORT_STATUS_LABEL } from "@/lib/import-labels";
import type { ImportMode, ImportStatus } from "@/lib/types";
import { RollbackButton } from "@/app/(app)/import/riwayat/RollbackButton";

type CampaignRef = { id: string; namaProduk: string };
type ImportLogRow = {
  id: string;
  mode: ImportMode;
  status: ImportStatus;
  namaFile: string;
  jumlahSukses: number;
  jumlahDilewati: number;
  createdAt: string;
  targetCampaign: CampaignRef | null;
  createdCampaigns: CampaignRef[];
};

interface Props {
  logs: ImportLogRow[];
}

export default function ImportHistoryTable({ logs }: Props) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageLogs = logs.slice(start, end);

  return (
    <Card>
      {logs.length === 0 ? (
        <EmptyState
          title="Belum ada sesi import"
          description="Sesi import yang Anda lakukan akan tercatat di sini."
        />
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Waktu</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Kampanye</th>
                <th className="px-5 py-3 font-medium">Sukses / Lewat</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageLogs.map((l) => {
                const kampanye = l.createdCampaigns[0] ?? l.targetCampaign ?? null;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600">{formatWaktu(l.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-700">{IMPORT_MODE_LABEL[l.mode]}</td>
                    <td className="px-5 py-3 text-slate-700">{l.namaFile}</td>
                    <td className="px-5 py-3">
                      {kampanye ? (
                        <Link href={`/kampanye/${kampanye.id}`} className="text-slate-900 hover:underline">
                          {kampanye.namaProduk}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{l.jumlahSukses} / {l.jumlahDilewati}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.status === "BERHASIL"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {IMPORT_STATUS_LABEL[l.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {l.status === "BERHASIL" && <RollbackButton importLogId={l.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-center items-center gap-3 py-3">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="rounded-lg px-4 py-2 text-sm bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="rounded-lg px-4 py-2 text-sm bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
