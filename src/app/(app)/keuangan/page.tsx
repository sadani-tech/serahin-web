import Link from "next/link";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader, EmptyState, Input, ScrollList, Select, StatItem } from "@/components/ui";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

type KeuanganSummary = {
  totalTransaksi: number;
  totalTerverifikasi: number;
  totalNilaiPesanan: number;
  totalHpp: number;
  labaSetelahHpp: number;
  hppBelumLengkap: number;
  ordersWithIncompleteHpp: { orderId: string; kampanye: string; totalNilaiPesanan: number }[];
  perKampanye: { kampanye: string; jumlahTransaksi: number; totalTerverifikasi: number; totalNilaiPesanan: number; totalHpp: number; labaSetelahHpp: number }[];
};

type PiutangRow = {
  orderId: string;
  kampanye: string;
  buyerNameSnapshot: string;
  totalPesanan: number;
  totalDibayar: number;
  sisaPiutang: number;
};

type Tab = "cashflow" | "ringkasan" | "piutang";
const TABS: [Tab, string][] = [
  ["cashflow", "Cashflow"],
  ["ringkasan", "Ringkasan Pesanan"],
  ["piutang", "Piutang"],
];

export default async function KeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; campaign?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const query = { campaign: sp.campaign, from: sp.from, to: sp.to };
  const tab: Tab = TABS.some(([t]) => t === sp.tab) ? (sp.tab as Tab) : "cashflow";

  let summary: KeuanganSummary;
  let piutang: PiutangRow[];
  let campaignList: { id: string; namaProduk: string }[];
  try {
    [summary, piutang, campaignList] = await Promise.all([
      api.get<KeuanganSummary>("/keuangan/laba-bersih", query),
      api.get<PiutangRow[]>("/keuangan/piutang", query),
      api.listAll<{ id: string; namaProduk: string }>("/pre-orders", { sort: "namaProduk", order: "asc" }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?callbackUrl=%2Fkeuangan");
    }
    throw error;
  }

  const totalPiutang = piutang.reduce((sum, row) => sum + row.sisaPiutang, 0);

  const tabHref = (t: Tab) => {
    const p = new URLSearchParams();
    p.set("tab", t);
    if (sp.campaign) p.set("campaign", sp.campaign);
    if (sp.from) p.set("from", sp.from);
    if (sp.to) p.set("to", sp.to);
    return `/keuangan?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
          Keuangan
        </h1>
        <p className="mt-1 text-sm text-sand-500">
          Laba bersih riil per Batch PO (HPP snapshot) dan piutang buyer yang
          belum lunas. Utang &amp; rekap Vendor ada di halaman detail Vendor.
        </p>
      </div>

      {/* Filter (PRD v2.3.8 §3.4 — rentang tanggal custom), berlaku untuk semua sub-tab */}
      <Card className="p-4">
        <form className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
          <input type="hidden" name="tab" value={tab} />
          <div className="col-span-2 sm:col-auto sm:w-56">
            <label className="mb-1 block text-xs font-medium text-sand-500">Batch PO</label>
            <Select name="campaign" defaultValue={sp.campaign ?? ""} className="w-full py-1.5">
              <option value="">Semua</option>
              {campaignList.map((c) => (
                <option key={c.id} value={c.id}>{c.namaProduk}</option>
              ))}
            </Select>
          </div>
          <div className="col-span-1 sm:col-auto">
            <label className="mb-1 block text-xs font-medium text-sand-500">Dari tanggal</label>
            <Input type="date" name="from" defaultValue={sp.from ?? ""} />
          </div>
          <div className="col-span-1 sm:col-auto">
            <label className="mb-1 block text-xs font-medium text-sand-500">Sampai tanggal</label>
            <Input type="date" name="to" defaultValue={sp.to ?? ""} />
          </div>
          <button type="submit" className="col-span-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 sm:col-auto">
            Terapkan
          </button>
        </form>
      </Card>

      {/* Sub-tab, supaya cashflow/ringkasan/piutang tidak tampil sekaligus */}
      <div className="flex gap-1 border-b border-sand-200">
        {TABS.map(([t, label]) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-brand-500 text-sand-900"
                : "border-transparent text-sand-500 hover:text-sand-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "cashflow" && (
        <div className="space-y-6">
          {/* Laba Bersih Riil (PRD v2.3.8 §3.1/§5.1) */}
          <Card>
            <CardHeader title="Laba Bersih Riil" subtitle="Nilai pesanan terverifikasi − HPP (snapshot saat pesan)" />
            <div className="grid grid-cols-2 divide-x divide-y divide-sand-100 sm:grid-cols-4 sm:divide-y-0">
              <StatItem label="Total Nilai Pesanan" value={formatRupiah(summary.totalNilaiPesanan)} />
              <StatItem label="Total HPP" value={formatRupiah(summary.totalHpp)} accent="text-amber-600" />
              <StatItem label="Laba Bersih Riil" value={formatRupiah(summary.labaSetelahHpp)} accent="text-emerald-600" />
              <StatItem label="HPP Belum Lengkap" value={`${summary.hppBelumLengkap} pesanan`} accent={summary.hppBelumLengkap > 0 ? "text-rose-600" : "text-sand-900"} />
            </div>
          </Card>

          {summary.hppBelumLengkap > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-900">
                {summary.hppBelumLengkap} pesanan belum masuk ke total laba di atas karena HPP belum lengkap
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Nilainya TIDAK dihilangkan — lengkapi Harga Pokok Penjualan (HPP) produk pada Batch PO terkait, lalu pesanan ini akan otomatis masuk ke perhitungan.
              </p>
              <ScrollList className="mt-3 divide-y divide-amber-100 rounded-lg bg-white/60" maxRows={10} rowHeight={2.75}>
                {summary.ordersWithIncompleteHpp.map((o) => (
                  <div key={o.orderId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="text-sand-700">{o.kampanye} · #{o.orderId.slice(0, 8)}</span>
                    <span className="font-semibold text-sand-900">{formatRupiah(o.totalNilaiPesanan)}</span>
                  </div>
                ))}
              </ScrollList>
            </Card>
          )}
        </div>
      )}

      {tab === "ringkasan" && (
        <Card>
          <CardHeader title="Rincian per Batch PO" />
          {summary.perKampanye.length === 0 ? (
            <EmptyState title="Belum ada data pada periode ini" />
          ) : (
            <ScrollList className="overflow-x-auto" maxRows={10} rowHeight={2.75}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                    <th className="px-5 py-3 font-medium">Batch PO</th>
                    <th className="px-5 py-3 font-medium">Transaksi</th>
                    <th className="px-5 py-3 font-medium">Nilai Pesanan</th>
                    <th className="px-5 py-3 font-medium">HPP</th>
                    <th className="px-5 py-3 font-medium">Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {summary.perKampanye.map((row) => (
                    <tr key={row.kampanye} className="hover:bg-sand-50">
                      <td className="px-5 py-3 font-medium text-sand-900">{row.kampanye}</td>
                      <td className="px-5 py-3 text-sand-600">{row.jumlahTransaksi}</td>
                      <td className="px-5 py-3 text-sand-700">{formatRupiah(row.totalNilaiPesanan)}</td>
                      <td className="px-5 py-3 text-amber-700">{formatRupiah(row.totalHpp)}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-700">{formatRupiah(row.labaSetelahHpp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollList>
          )}
        </Card>
      )}

      {tab === "piutang" && (
        // Piutang Buyer (PRD v2.3.8 §5.5) — terpisah, bukan pengurang laba
        <Card>
          <CardHeader
            title="Piutang Buyer"
            subtitle={`Total sisa piutang: ${formatRupiah(totalPiutang)}`}
          />
          {piutang.length === 0 ? (
            <EmptyState title="Tidak ada piutang buyer pada periode ini" />
          ) : (
            <ScrollList className="overflow-x-auto" maxRows={10} rowHeight={2.75}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                    <th className="px-5 py-3 font-medium">Pesanan</th>
                    <th className="px-5 py-3 font-medium">Batch PO</th>
                    <th className="px-5 py-3 font-medium">Total Pesanan</th>
                    <th className="px-5 py-3 font-medium">Sudah Dibayar</th>
                    <th className="px-5 py-3 font-medium">Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {piutang.map((row) => (
                    <tr key={row.orderId} className="hover:bg-sand-50">
                      <td className="px-5 py-3">
                        <Link href={`/pesanan/${row.orderId}`} className="font-medium text-brand-700 hover:underline">
                          {row.buyerNameSnapshot}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sand-600">{row.kampanye}</td>
                      <td className="px-5 py-3 text-sand-700">{formatRupiah(row.totalPesanan)}</td>
                      <td className="px-5 py-3 text-sand-700">{formatRupiah(row.totalDibayar)}</td>
                      <td className="px-5 py-3 font-semibold text-rose-700">{formatRupiah(row.sisaPiutang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollList>
          )}
        </Card>
      )}
    </div>
  );
}
