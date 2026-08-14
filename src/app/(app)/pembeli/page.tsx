import { api } from "@/lib/api";
import PembeliTable, {
  type PembeliMeta,
  type PembeliRow,
} from "@/components/PembeliTable";

export const dynamic = "force-dynamic";

export default async function PembeliPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    campaignId?: string;
    status?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const sp = await searchParams;

  const [campaigns, res] = await Promise.all([
    api.list<{ id: string; namaProduk: string }>("/kampanye"),
    api.get<{ data: PembeliRow[]; meta: PembeliMeta }>("/pembeli", {
      search: sp.search,
      campaignId: sp.campaignId,
      status: sp.status,
      page: sp.page,
      sort: sp.sort,
      order: sp.order,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pembeli
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Semua pembeli lintas kampanye — saring berdasarkan kampanye, status,
          atau cari nama/kontak.
        </p>
      </div>

      <PembeliTable
        rows={res.data}
        meta={res.meta}
        campaigns={campaigns}
        filters={{
          search: sp.search ?? "",
          campaignId: sp.campaignId ?? "",
          status: sp.status ?? "",
          sort: sp.sort ?? "createdAt",
          order: sp.order === "asc" ? "asc" : "desc",
        }}
      />
    </div>
  );
}
