import Link from "next/link";
import { api } from "@/lib/api";
import { CampaignBadge } from "@/components/badges";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { formatRupiah, formatTanggal, toNumber } from "@/lib/format";
import { deleteCampaign } from "./actions";
import type { CampaignStatus } from "@/lib/types";
import CampaignTable from "@/components/CampaignTable";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  namaProduk: string;
  status: CampaignStatus;
  tanggalTutup: string | null;
  kuotaTotal: number;
  terisi: number;
  variants: { harga: string }[];
  _count: { orders: number };
};

export default async function KampanyeListPage() {
  const campaigns = await api.get<CampaignRow[]>("/kampanye");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Kampanye PO
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua batch Pre-Order dalam satu tempat.
          </p>
        </div>
        <LinkButton href="/kampanye/baru">+ Baru</LinkButton>
      </div>

      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
