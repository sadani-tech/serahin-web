import Link from "next/link";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { CampaignBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/domain";
import {
  getDashboardData,
  persenKuotaColor,
  NEAR_DEADLINE_DAYS,
  STALE_TIMELINE_DAYS,
} from "@/lib/dashboard";
import { CampaignStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && sp.status in CAMPAIGN_STATUS_LABEL
      ? (sp.status as CampaignStatus)
      : undefined;

  const data = await getDashboardData({
    status,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  });

  const adaFilter = !!(status || sp.dateFrom || sp.dateTo);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
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
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Status kampanye
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset ring-slate-300"
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
              Buka PO dari
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={sp.dateFrom ?? ""}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset ring-slate-300"
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
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset ring-slate-300"
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Kampanye aktif
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {data.jumlahKampanyeAktif}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Dana masuk terverifikasi
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatRupiah(data.totalCashflow)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            dari {formatRupiah(data.totalNilaiPesanan)} nilai pesanan aktif
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Perlu perhatian
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${data.perluPerhatian.length > 0 ? "text-rose-600" : "text-slate-900"}`}
          >
            {data.perluPerhatian.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            pesanan belum lunas mendekati deadline
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perlu Perhatian (FR-6.3) */}
        <Card>
          <CardHeader
            title="Perlu perhatian"
            subtitle={`Belum lunas & deadline pelunasan ≤ ${NEAR_DEADLINE_DAYS} hari`}
          />
          {data.perluPerhatian.length === 0 ? (
            <EmptyState title="Tidak ada yang mendesak" description="Semua pesanan aman dari deadline pelunasan." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.perluPerhatian.map((item) => (
                <li key={item.orderId}>
                  <Link
                    href={`/pesanan/${item.orderId}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {item.namaPembeli}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.namaProduk} · {item.varian}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-rose-600">
                        {formatRupiah(item.sisa)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.lewat
                          ? `lewat ${Math.abs(item.hariTersisa ?? 0)} hari`
                          : item.hariTersisa === 0
                            ? "hari ini"
                            : `${item.hariTersisa} hari lagi`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Kampanye belum diupdate (FR-6.4) */}
        <Card>
          <CardHeader
            title="Belum diupdate"
            subtitle={`Kampanye aktif tanpa update timeline ≥ ${STALE_TIMELINE_DAYS} hari`}
          />
          {data.staleCampaigns.length === 0 ? (
            <EmptyState title="Semua kampanye ter-update" description="Tidak ada kampanye yang lama tak disentuh." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.staleCampaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/kampanye/${c.id}?tab=timeline`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {c.namaProduk}
                      </p>
                      <p className="text-xs text-slate-500">
                        update terakhir {formatTanggal(c.lastUpdate)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {c.hariLalu} hari lalu
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Kampanye aktif (FR-6.1) */}
      <Card>
        <CardHeader
          title="Kampanye aktif"
          subtitle="Progres kuota terisi per kampanye"
        />
        {data.activeCampaigns.length === 0 ? (
          <EmptyState
            title="Belum ada kampanye aktif"
            description="Buat kampanye baru atau ubah filter."
            action={<LinkButton href="/kampanye/baru">+ Kampanye Baru</LinkButton>}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.activeCampaigns.map((c) => (
              <Link
                key={c.id}
                href={`/kampanye/${c.id}`}
                className="block px-5 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {c.namaProduk}
                    </span>
                    <CampaignBadge status={c.status} />
                  </div>
                  <span className="text-sm text-slate-600">
                    {c.terisi} / {c.kuotaTotal} ({c.persen}%)
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${persenKuotaColor(c.persen)}`}
                    style={{ width: `${Math.min(100, c.persen)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
