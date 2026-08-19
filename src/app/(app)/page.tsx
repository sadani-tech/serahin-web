import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/domain";
import { getDashboardData, persenKuotaColor, NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS } from "@/lib/dashboard";
import { CampaignStatus } from "@/lib/types";
import { DashboardSection, ActiveCampaignsCard } from "@/components/DashboardSection";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string; campaignId?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && sp.status in CAMPAIGN_STATUS_LABEL
      ? (sp.status as CampaignStatus)
      : undefined;

  const [data, campaignList] = await Promise.all([
    getDashboardData({
      status,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
      campaignId: sp.campaignId,
    }),
    api.list<{ id: string; namaProduk: string }>("/kampanye"),
  ]);

  const adaFilter = !!(status || sp.dateFrom || sp.dateTo || sp.campaignId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan lintas-kampanye untuk keputusan cepat.
          </p>
        </div>
        <LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>
      </div>

      {/* Filter (FR-6.6) */}
      <Card className="p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Status kampanye
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Semua</option>
              {Object.entries(CAMPAIGN_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Kampanye
            </label>
            <select
              name="campaignId"
              defaultValue={sp.campaignId ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Semua</option>
              {campaignList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.namaProduk}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Buka PO dari
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={sp.dateFrom ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              sampai
            </label>
            <input
              type="date"
              name="dateTo"
              defaultValue={sp.dateTo ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Terapkan
          </button>
          {adaFilter && (
            <Link
              href="/"
              className="px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Reset
            </Link>
          )}
        </form>
      </Card>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Kampanye aktif
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {data.jumlahKampanyeAktif}
          </p>
        </Card>
        <Card className="col-span-2 px-4 py-3 sm:col-span-1 sm:px-5 sm:py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Dana masuk
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">
            {formatRupiah(data.totalCashflow)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            dari {formatRupiah(data.totalNilaiPesanan)} total
          </p>
        </Card>
        <Card className="px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Perlu perhatian
          </p>
          <p className={`mt-1 text-2xl font-bold ${data.perluPerhatian.length > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {data.perluPerhatian.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            mendekati deadline
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Perlu perhatian"
          subtitle={`Belum lunas & deadline pelunasan ≤ ${NEAR_DEADLINE_DAYS} hari`}
          itemCount={data.perluPerhatian.length}
          emptyMessage="Tidak ada yang mendesak"
          emptyDescription="Semua pesanan aman dari deadline pelunasan."
        >
          {data.perluPerhatian.map((item) => (
            <Link
              key={item.orderId}
              href={`/pesanan/${item.orderId}`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.namaPembeli}</p>
                <p className="truncate text-xs text-slate-500">{item.namaProduk} · {item.varian}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-rose-600">{formatRupiah(item.sisa)}</p>
                <p className="text-xs text-slate-500">
                  {item.lewat ? `lewat ${Math.abs(item.hariTersisa ?? 0)} hari` : item.hariTersisa === 0 ? "hari ini" : `${item.hariTersisa} hari lagi`}
                </p>
              </div>
            </Link>
          ))}
        </DashboardSection>
        <DashboardSection
          title="Belum diupdate"
          subtitle={`Kampanye aktif tanpa update timeline ≥ ${STALE_TIMELINE_DAYS} hari`}
          itemCount={data.staleCampaigns.length}
          emptyMessage="Semua kampanye ter-update"
          emptyDescription="Tidak ada kampanye yang lama tak disentuh."
        >
          {data.staleCampaigns.map((item) => (
            <Link
              key={item.id}
              href={`/kampanye/${item.id}?tab=timeline`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.namaProduk}</p>
                <p className="text-xs text-slate-500">update terakhir {formatTanggal(item.lastUpdate)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{item.hariLalu} hari lalu</span>
            </Link>
          ))}
        </DashboardSection>
      </div>
      <ActiveCampaignsCard items={data.activeCampaigns} />
    </div>
  );
}
