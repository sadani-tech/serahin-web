import Link from "next/link";
import { api } from "@/lib/api";
import ImportHistoryTable from "@/components/ImportHistoryTable";
import type { ImportMode, ImportStatus } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui";

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
type MigrationLogRow = {
  id: string;
  nama: string;
  jumlahKampanye: number;
  jumlahPesanan: number;
  jumlahGagal: number;
  gagalDetail: string | null;
  createdAt: string;
};

export default async function RiwayatImportPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string }>;
}) {
  const sp = await searchParams;

  const [logs, migrations] = await Promise.all([
    api.get<ImportLogRow[]>("/import/riwayat"),
    api.get<MigrationLogRow[]>("/import/riwayat-migrasi"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/import" className="text-sm text-sand-500 hover:text-sand-700">
          ← Import
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Riwayat Sesi Import
        </h1>
      </div>

      {sp.sukses && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          Import berhasil disimpan.
        </div>
      )}

<ImportHistoryTable logs={logs} />
      <Card>
        <CardHeader title="Riwayat Migrasi Skema" subtitle="Audit migrasi otomatis, termasuk jumlah data gagal yang perlu ditinjau." />
        {migrations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sand-500">Belum ada migrasi skema tercatat.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-sand-500"><th className="px-5 py-3">Migrasi</th><th className="px-5 py-3">Kampanye</th><th className="px-5 py-3">Pesanan</th><th className="px-5 py-3">Gagal</th><th className="px-5 py-3">Detail</th></tr></thead><tbody className="divide-y">{migrations.map((migration) => <tr key={migration.id}><td className="px-5 py-3 font-medium">{migration.nama}</td><td className="px-5 py-3">{migration.jumlahKampanye}</td><td className="px-5 py-3">{migration.jumlahPesanan}</td><td className={`px-5 py-3 ${migration.jumlahGagal ? "font-medium text-rose-600" : "text-emerald-600"}`}>{migration.jumlahGagal}</td><td className="max-w-md whitespace-pre-wrap px-5 py-3 text-xs text-sand-500">{migration.gagalDetail ?? "-"}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </div>
  );
}
