import { api } from "@/lib/api";
import { LinkButton } from "@/components/ui";
import type { CampaignStatus } from "@/lib/types";
import PreorderTable from "@/components/PreorderTable";

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

export default async function PreorderListPage() {
  const campaigns = await api.list<CampaignRow>("/pre-orders");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-sand-900 sm:text-2xl">
            Pre-Order
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Semua batch Pre-Order dalam satu tempat.
          </p>
        </div>
        <LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton>
      </div>

      <PreorderTable campaigns={campaigns} />
    </div>
  );
}
