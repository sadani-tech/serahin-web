import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ORDER_STATUS_LABEL } from "@/lib/domain";
import type { OrderStatus } from "@/lib/types";
import { LegacyPreview, type LegacyPreviewRow } from "./LegacyPreview";

export const dynamic = "force-dynamic";

type LegacyDraftResponse = {
  draft: { id: string; namaFile: string; targetCampaignId: string };
  data: {
    dpNominal: number;
    defaultStatus: OrderStatus;
    verifikasi: string;
    rows: LegacyPreviewRow[];
  };
  variants: { id: string; namaVarian: string }[];
};

export default async function LegacyPreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  let res: LegacyDraftResponse;
  try {
    res = await api.get<LegacyDraftResponse>(`/import/legacy/draft/${draftId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const { draft, data, variants } = res;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/import/legacy/${draft.targetCampaignId}`}
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Batal & ulang
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-900">
          Pratinjau Import Format Lawas
        </h1>
        <p className="mt-1 text-sm text-sand-500">{draft.namaFile}</p>
      </div>

      <LegacyPreview
        draftId={draftId}
        rows={data.rows}
        variants={variants.map((v) => ({ id: v.id, nama: v.namaVarian }))}
        dpNominal={data.dpNominal}
        defaultStatusLabel={ORDER_STATUS_LABEL[data.defaultStatus]}
      />
    </div>
  );
}
