import Link from "next/link";
import { api } from "@/lib/api";
import ImportHistoryTable from "@/components/ImportHistoryTable";
import type { ImportMode, ImportStatus } from "@/lib/types";

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

<ImportHistoryTable logs={logs} />
    </div>
  );
}
