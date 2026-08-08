import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui";
import { ImportUploadForm } from "./ImportUploadForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const campaigns = await api.get<{ id: string; namaProduk: string }[]>(
    "/kampanye",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Import Data Historis
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan riwayat kampanye & pesanan lama secara massal via Excel/CSV.
          </p>
        </div>
        <Link
          href="/import/riwayat"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Riwayat sesi import →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Mode A — Kampanye Penuh"
            subtitle="Buat kampanye lama lengkap (info + varian + pesanan + pembayaran)."
          />
          <div className="px-5 py-4">
            <ImportUploadForm mode="KAMPANYE_PENUH" />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Mode B — Pesanan ke Kampanye Ada"
            subtitle="Tambah pesanan+pembayaran historis ke kampanye yang sudah dibuat."
          />
          <div className="px-5 py-4">
            <ImportUploadForm mode="PESANAN" campaigns={campaigns} />
          </div>
        </Card>
      </div>

      <p className="text-xs text-slate-400">
        Data akan ditampilkan sebagai pratinjau lebih dulu sebelum benar-benar
        masuk ke sistem. Baris bermasalah bisa dilewati, dan seluruh sesi dapat
        di-rollback dari halaman Riwayat.
      </p>
    </div>
  );
}
