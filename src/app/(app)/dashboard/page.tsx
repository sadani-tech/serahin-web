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
    api.list<{ id: string; namaProduk: string }>("/pre-orders"),
  ]);

  const adaFilter = !!(status || sp.dateFrom || sp.dateTo || sp.campaignId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-sand-900 sm:text-2xl">
            <span className="underline-sun">Dashboard</span>
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Ringkasan seluruh Batch PO untuk keputusan cepat.
          </p>
        </div>
        <LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton>
      </div>

      {/* Filter (FR-6.6) */}
      <Card className="p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-sand-500">
              Status Batch PO
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
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
            <label className="mb-1 block text-xs font-medium text-sand-500">
              Batch PO
            </label>
            <select
              name="campaignId"
              defaultValue={sp.campaignId ?? ""}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
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
            <label className="mb-1 block text-xs font-medium text-sand-500">
              Buka PO dari
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={sp.dateFrom ?? ""}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sand-500">
              sampai
            </label>
            <input
              type="date"
              name="dateTo"
              defaultValue={sp.dateTo ?? ""}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Terapkan
          </button>
          {adaFilter && (
            <Link
              href="/"
              className="px-2 py-1.5 text-sm text-sand-500 hover:text-sand-700"
            >
              Reset
            </Link>
          )}
        </form>
      </Card>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Batch PO aktif"
          value={data.jumlahKampanyeAktif}
          note="sedang berjalan"
          tone="brand"
          icon={
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />
          }
        />
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Dana masuk"
          value={formatRupiah(data.totalCashflow)}
          note={`dari ${formatRupiah(data.totalNilaiPesanan)} total`}
          tone="brand"
          compact
          icon={
            <>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          }
        />
        <StatCard
          label="Perlu perhatian"
          value={data.perluPerhatian.length}
          note="mendekati deadline"
          tone={data.perluPerhatian.length > 0 ? "danger" : "muted"}
          icon={
            <>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </>
          }
        />
        <StatCard
          href="/verifikasi"
          label="Menunggu verifikasi"
          value={data.menungguVerifikasi}
          note="pesanan baru masuk"
          tone={data.menungguVerifikasi > 0 ? "accent" : "muted"}
          icon={
            <>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </>
          }
        />
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
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sand-900">{item.namaPembeli}</p>
                <p className="truncate text-xs text-sand-500">{item.namaProduk} · {item.varian}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-rose-600">{formatRupiah(item.sisa)}</p>
                <p className="text-xs text-sand-500">
                  {item.lewat ? `lewat ${Math.abs(item.hariTersisa ?? 0)} hari` : item.hariTersisa === 0 ? "hari ini" : `${item.hariTersisa} hari lagi`}
                </p>
              </div>
            </Link>
          ))}
        </DashboardSection>
        <DashboardSection
          title="Belum diupdate"
          subtitle={`Batch PO aktif tanpa update timeline ≥ ${STALE_TIMELINE_DAYS} hari`}
          itemCount={data.staleCampaigns.length}
          emptyMessage="Semua Batch PO ter-update"
          emptyDescription="Tidak ada Batch PO yang lama tidak diperbarui."
        >
          {data.staleCampaigns.map((item) => (
            <Link
              key={item.id}
              href={`/pre-orders/${item.id}?tab=timeline`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sand-900">{item.namaProduk}</p>
                <p className="text-xs text-sand-500">update terakhir {formatTanggal(item.lastUpdate)}</p>
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

/**
 * Kartu metrik dashboard dengan ikon berwarna sesuai peran angkanya (v1.9).
 * `tone` menentukan warna ikon & angka: brand (normal), accent (perlu
 * tindakan), danger (mendesak), muted (nol/tidak ada apa-apa).
 */
function StatCard({
  label,
  value,
  note,
  icon,
  tone = "brand",
  href,
  compact = false,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ReactNode;
  tone?: "brand" | "accent" | "danger" | "muted";
  href?: string;
  /** Nilai panjang (mis. rupiah) memakai ukuran teks lebih kecil. */
  compact?: boolean;
  className?: string;
}) {
  const tones = {
    brand: { chip: "bg-brand-100 text-brand-700", value: "text-brand-700" },
    accent: { chip: "bg-accent-100 text-accent-700", value: "text-accent-700" },
    danger: { chip: "bg-rose-100 text-rose-700", value: "text-rose-700" },
    muted: { chip: "bg-sand-100 text-sand-500", value: "text-sand-900" },
  }[tone];

  const body = (
    <Card
      className={`h-full px-4 py-3.5 transition sm:px-5 sm:py-4 ${
        href ? "hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
          {label}
        </p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tones.chip}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            {icon}
          </svg>
        </span>
      </div>
      <p
        className={`mt-1.5 font-extrabold tracking-tight ${tones.value} ${
          compact ? "text-xl sm:text-2xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-0.5 text-xs text-sand-500">{note}</p>}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
