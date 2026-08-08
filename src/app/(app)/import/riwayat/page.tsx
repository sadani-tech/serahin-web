import Link from "next/link";
import { api } from "@/lib/api";
import { Card, EmptyState } from "@/components/ui";
import { formatWaktu } from "@/lib/format";
import { IMPORT_MODE_LABEL, IMPORT_STATUS_LABEL } from "@/lib/import-labels";
import type { ImportMode, ImportStatus } from "@/lib/types";
import { RollbackButton } from "./RollbackButton";

export const dynamic = "force-dynamic";

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

export default async function RiwayatImportPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string }>;
}) {
  const sp = await searchParams;

  const logs = await api.get<ImportLogRow[]>("/import/riwayat");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/import" className="text-sm text-slate-500 hover:text-slate-700">
          ← Import
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Riwayat Sesi Import
        </h1>
      </div>

      {sp.sukses && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          Import berhasil disimpan.
        </div>
      )}

      <Card>
        {logs.length === 0 ? (
          <EmptyState
            title="Belum ada sesi import"
            description="Sesi import yang Anda lakukan akan tercatat di sini."
          />
        ) : (
          <div className="overflow-x-auto">
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
                {logs.map((l) => {
                  const kampanye =
                    l.createdCampaigns[0] ?? l.targetCampaign ?? null;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-600">
                        {formatWaktu(l.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {IMPORT_MODE_LABEL[l.mode]}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{l.namaFile}</td>
                      <td className="px-5 py-3">
                        {kampanye ? (
                          <Link
                            href={`/kampanye/${kampanye.id}`}
                            className="text-slate-900 hover:underline"
                          >
                            {kampanye.namaProduk}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {l.jumlahSukses} / {l.jumlahDilewati}
                      </td>
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
                        {l.status === "BERHASIL" && (
                          <RollbackButton importLogId={l.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
