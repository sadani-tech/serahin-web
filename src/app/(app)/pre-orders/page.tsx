import Link from "next/link";
import { api } from "@/lib/api";
import { LinkButton, Select, Input } from "@/components/ui";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/domain";
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

type SearchParams = { q?: string; status?: string; page?: string };

export default async function PreorderListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const status =
    sp.status && sp.status in CAMPAIGN_STATUS_LABEL
      ? (sp.status as CampaignStatus)
      : undefined;

  const { data: campaigns, meta } = await api.get<{
    data: CampaignRow[];
    meta: { page: number; totalPages: number; total: number };
  }>("/pre-orders", { search: sp.q, status, page });

  const qs = (overrides: Partial<SearchParams>) => {
    const merged = { ...sp, ...overrides };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const s = params.toString();
    return s ? `?${s}` : "";
  };
  const adaFilter = !!(sp.q || sp.status);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-sand-900 sm:text-2xl">
            Pre-Order
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Semua batch Pre-Order dalam satu tempat. {meta.total} Batch PO ditemukan.
          </p>
        </div>
        <LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton>
      </div>

      {/* Filter & search (v2.3.7 FR-37.28) */}
      <form className="mb-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-sand-200 bg-white p-4 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
        <label className="col-span-2 sm:col-auto sm:min-w-[220px]">
          <span className="mb-1 block text-xs font-medium text-sand-500">
            Cari Batch PO
          </span>
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Nama produk…"
            className="w-full py-1.5"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-sand-500">
            Status
          </span>
          <Select name="status" defaultValue={sp.status ?? ""} className="w-full py-1.5 sm:w-auto">
            <option value="">Semua</option>
            {Object.entries(CAMPAIGN_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </label>
        <div className="col-span-2 flex items-center gap-3 sm:col-auto">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-brand transition-all hover:bg-brand-700 active:translate-y-px sm:flex-none"
          >
            Terapkan
          </button>
          {adaFilter && (
            <Link
              href="/pre-orders"
              className="text-sm font-medium text-sand-500 hover:text-sand-700"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <PreorderTable campaigns={campaigns} />

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Link
            href={`/pre-orders${qs({ page: String(Math.max(1, page - 1)) })}`}
            className={
              page <= 1
                ? "pointer-events-none opacity-40"
                : "text-brand-700 hover:underline"
            }
          >
            ← Sebelumnya
          </Link>
          <span>
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <Link
            href={`/pre-orders${qs({ page: String(Math.min(meta.totalPages, page + 1)) })}`}
            className={
              page >= meta.totalPages
                ? "pointer-events-none opacity-40"
                : "text-brand-700 hover:underline"
            }
          >
            Berikutnya →
          </Link>
        </div>
      )}
    </div>
  );
}
