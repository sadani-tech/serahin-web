import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/domain";
import { OrderStatus } from "@/generated/prisma";
import { LegacyPreview, type LegacyPreviewRow } from "./LegacyPreview";

export const dynamic = "force-dynamic";

export default async function LegacyPreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const draft = await prisma.importDraft.findUnique({ where: { id: draftId } });
  if (!draft || draft.mode !== "LEGACY" || !draft.targetCampaignId) notFound();

  const data = draft.data as unknown as {
    dpNominal: number;
    defaultStatus: OrderStatus;
    verifikasi: string;
    rows: LegacyPreviewRow[];
  };

  const campaign = await prisma.campaign.findUnique({
    where: { id: draft.targetCampaignId },
    include: { variants: { select: { id: true, namaVarian: true } } },
  });
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/import/legacy/${draft.targetCampaignId}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Batal & ulang
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Pratinjau Import Format Lawas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {campaign.namaProduk} · {draft.namaFile}
        </p>
      </div>

      <LegacyPreview
        draftId={draftId}
        rows={data.rows}
        variants={campaign.variants.map((v) => ({ id: v.id, nama: v.namaVarian }))}
        dpNominal={data.dpNominal}
        defaultStatusLabel={ORDER_STATUS_LABEL[data.defaultStatus]}
      />
    </div>
  );
}
