import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getDashboardData, NEAR_DEADLINE_DAYS, STALE_TIMELINE_DAYS } from "@/lib/dashboard";
import { ActiveCampaignsCard, DashboardSection } from "@/components/DashboardSection";
import { Card, LinkButton } from "@/components/ui";

type SellerProfile = { businessName: string; slug: string; status: string };

export default async function SellerDashboardPage() {
  const [profile, data] = await Promise.all([
    api.get<SellerProfile>("/seller/profile"),
    getDashboardData({}),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Seller dashboard</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900 sm:text-3xl">{profile.businessName}</h1><p className="mt-1 text-sm text-sand-500">Ringkasan operasional Batch PO dan pembayaran toko Anda.</p></div>
        <div className="flex gap-2"><LinkButton href={`/catalog?seller=${encodeURIComponent(profile.slug)}`} variant="secondary">Lihat storefront</LinkButton><LinkButton href="/pre-orders/baru">+ Buat Batch PO</LinkButton></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Batch PO aktif" value={data.jumlahKampanyeAktif} note="sedang berjalan" />
        <Metric label="Dana masuk" value={formatRupiah(data.totalCashflow)} note={`dari ${formatRupiah(data.totalNilaiPesanan)}`} />
        <Metric label="Perlu perhatian" value={data.perluPerhatian.length} note="mendekati deadline" warning={data.perluPerhatian.length > 0} />
        <Metric label="Pesanan baru" value={data.menungguVerifikasi} note="menunggu verifikasi" warning={data.menungguVerifikasi > 0} />
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

function Metric({ label, value, note, warning = false }: { label: string; value: React.ReactNode; note: string; warning?: boolean }) {
  return <Card className="p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-sand-500">{label}</p><p className={`mt-2 text-2xl font-extrabold ${warning ? "text-accent-700" : "text-brand-700"}`}>{value}</p><p className="mt-1 text-xs text-sand-500">{note}</p></Card>;
}
