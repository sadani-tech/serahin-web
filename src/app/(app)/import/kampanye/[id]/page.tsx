import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui";
import { ImportUploadForm } from "../../ImportUploadForm";

export const dynamic = "force-dynamic";

export default async function ImportKeKampanyePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, namaProduk: true },
  });
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/kampanye/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← {campaign.namaProduk}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Impor Pesanan ke Kampanye Ini
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tambahkan pesanan & pembayaran historis ke {campaign.namaProduk}.
        </p>
      </div>

      <Card>
        <CardHeader title="Mode B — Pesanan" subtitle="Template 2 sheet (Pesanan + Pembayaran)." />
        <div className="px-5 py-4">
          <ImportUploadForm mode="PESANAN" fixedCampaignId={id} />
        </div>
      </Card>

      <p className="text-sm text-slate-500">
        Punya data mentah ekspor Google Form (kolom gabungan)?{" "}
        <Link
          href={`/import/legacy/${id}`}
          className="font-medium text-slate-900 underline hover:text-slate-700"
        >
          Gunakan Import Format Lawas
        </Link>
        .
      </p>
    </div>
  );
}
