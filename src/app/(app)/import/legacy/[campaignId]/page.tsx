import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui";
import { LegacyUploadForm } from "./LegacyUploadForm";

export const dynamic = "force-dynamic";

export default async function LegacyImportPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  let campaign: { id: string; namaProduk: string; variants: unknown[] };
  try {
    campaign = await api.get(`/kampanye/${campaignId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const jumlahVarian = campaign.variants.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/kampanye/${campaignId}`}
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← {campaign.namaProduk}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Import Format Lawas
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Untuk data mentah ekspor Google Form (kolom gabungan) ke kampanye{" "}
          {campaign.namaProduk}.
        </p>
      </div>

      {jumlahVarian === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-rose-700">
            Kampanye ini belum punya varian. Tambahkan varian dulu agar hasil
            parsing bisa dicocokkan.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Pengaturan sesi"
            subtitle="Nominal & status diterapkan ke seluruh baris sesi ini."
          />
          <div className="px-5 py-4">
            <LegacyUploadForm campaignId={campaignId} />
          </div>
        </Card>
      )}
    </div>
  );
}
