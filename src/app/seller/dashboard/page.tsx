import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getDashboardData, NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS } from "@/lib/dashboard";
import { ActiveCampaignsCard, DashboardSection } from "@/components/DashboardSection";
import { Card, LinkButton, Select, Input } from "@/components/ui";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/domain";
import type { CampaignStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type SellerProfile = { businessName: string; slug: string; status: string };

export default async function SellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string; campaignId?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && sp.status in CAMPAIGN_STATUS_LABEL
      ? (sp.status as CampaignStatus)
      : undefined;

  const [profile, data, campaignList] = await Promise.all([
    api.get<SellerProfile>("/seller/profile"),
    getDashboardData({ status, dateFrom: sp.dateFrom, dateTo: sp.dateTo, campaignId: sp.campaignId }),
    // v2.3.7 FR-37.26: dropdown filter wajib menampilkan seluruh Batch PO
    // milik Seller ini, bukan 20 pertama (default paginasi `/pre-orders`).
    api.listAll<{ id: string; namaProduk: string }>("/pre-orders", { sort: "namaProduk", order: "asc" }),
  ]);
  const adaFilter = !!(status || sp.dateFrom || sp.dateTo || sp.campaignId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Seller dashboard</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900 sm:text-3xl">{profile.businessName}</h1><p className="mt-1 text-sm text-sand-500">Ringkasan operasional Batch PO dan pembayaran toko Anda.</p></div>
        <div className="flex gap-2"><LinkButton href={`/catalog?seller=${encodeURIComponent(profile.slug)}`} variant="secondary">Lihat storefront</LinkButton><LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton></div>
      </div>

      {/* Filter (v2.3.7 — sebelumnya cuma ada di dashboard Admin) */}
      <Card className="p-4">
        <form className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
          <div className="col-span-2 sm:col-auto">
            <label className="mb-1 block text-xs font-medium text-sand-500">Status Batch PO</label>
            <Select name="status" defaultValue={status ?? ""} className="w-full py-1.5 sm:w-auto">
              <option value="">Semua</option>
              {Object.entries(CAMPAIGN_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <div className="col-span-2 sm:col-auto">
            <label className="mb-1 block text-xs font-medium text-sand-500">Batch PO</label>
            <Select name="campaignId" defaultValue={sp.campaignId ?? ""} className="w-full py-1.5 sm:w-auto">
              <option value="">Semua</option>
              {campaignList.map((c) => (
                <option key={c.id} value={c.id}>{c.namaProduk}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sand-500">Buka PO dari</label>
            <Input type="date" name="dateFrom" defaultValue={sp.dateFrom ?? ""} className="w-full py-1.5 sm:w-auto" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-sand-500">sampai</label>
            <Input type="date" name="dateTo" defaultValue={sp.dateTo ?? ""} className="w-full py-1.5 sm:w-auto" />
          </div>
          <div className="col-span-2 flex items-center gap-3 sm:col-auto">
            <button type="submit" className="flex-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-brand transition-all hover:bg-brand-700 active:translate-y-px sm:flex-none">
              Terapkan
            </button>
            {adaFilter && (
              <Link href="/seller/dashboard" className="text-sm font-medium text-sand-500 hover:text-sand-700">
                Reset
              </Link>
            )}
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric label="Batch PO aktif" value={data.jumlahKampanyeAktif} note="sedang berjalan" />
        <Metric label="Dana masuk" value={formatRupiah(data.totalCashflow)} note={`dari ${formatRupiah(data.totalNilaiPesanan)}`} />
        <Metric label="Laba setelah HPP" value={formatRupiah(data.labaKotor)} note={data.hppBelumLengkap ? `${data.hppBelumLengkap} order HPP belum lengkap` : `HPP ${formatRupiah(data.totalHpp)}`} />
        <Metric label="Pesanan baru" value={data.pesananBaru} note="perlu dikonfirmasi" href="/verifikasi?tab=orders" warning={data.pesananBaru > 0} />
        <Metric label="Pembayaran menunggu" value={data.pembayaranMenunggu} note="perlu diverifikasi" href="/verifikasi?tab=payments" warning={data.pembayaranMenunggu > 0} />
        <Metric label="Pelunasan jatuh tempo" value={data.pelunasanJatuhTempo} note="perlu ditindaklanjuti" warning={data.pelunasanJatuhTempo > 0} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Perlu perhatian" subtitle={`Belum lunas dan deadline ≤ ${NEAR_DEADLINE_DAYS} hari`} itemCount={data.perluPerhatian.length} emptyMessage="Tidak ada yang mendesak" emptyDescription="Semua pesanan aman dari deadline pelunasan.">
          {data.perluPerhatian.map((item) => <Link key={item.orderId} href={`/pesanan/${item.orderId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand-50"><div className="min-w-0"><p className="truncate font-bold text-sand-900">{item.namaPembeli}</p><p className="truncate text-xs text-sand-500">{item.namaProduk} · {item.varian}</p></div><div className="text-right"><p className="font-bold text-rose-700">{formatRupiah(item.sisa)}</p><p className="text-xs text-sand-500">{item.lewat ? "melewati deadline" : `${item.hariTersisa ?? 0} hari lagi`}</p></div></Link>)}
        </DashboardSection>
        <DashboardSection title="Belum diperbarui" subtitle={`Timeline tidak diperbarui ≥ ${STALE_TIMELINE_DAYS} hari`} itemCount={data.staleCampaigns.length} emptyMessage="Semua Batch PO terbarui" emptyDescription="Tidak ada Batch PO yang lama tidak diperbarui.">
          {data.staleCampaigns.map((item) => <Link key={item.id} href={`/pre-orders/${item.id}?tab=timeline`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand-50"><div><p className="font-bold text-sand-900">{item.namaProduk}</p><p className="text-xs text-sand-500">Terakhir {formatTanggal(item.lastUpdate)}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{item.hariLalu} hari</span></Link>)}
        </DashboardSection>
      </div>
      <ActiveCampaignsCard items={data.activeCampaigns} />
    </div>
  );
}

function Metric({ label, value, note, warning = false, href }: { label: string; value: React.ReactNode; note: string; warning?: boolean; href?: string }) {
  const body = <Card className={`h-full p-3 sm:p-4 ${href ? "transition hover:border-brand-300 hover:shadow-md" : ""}`}><p className="text-[10px] font-extrabold uppercase tracking-wide text-sand-500 sm:text-xs">{label}</p><p className={`mt-1.5 whitespace-nowrap text-lg font-extrabold leading-tight tracking-tight sm:mt-2 sm:text-xl lg:text-2xl ${warning ? "text-accent-700" : "text-brand-700"}`}>{value}</p><p className="mt-1 text-[11px] leading-tight text-sand-500 sm:text-xs">{note}</p></Card>;
  return href ? <Link href={href}>{body}</Link> : body;
}
