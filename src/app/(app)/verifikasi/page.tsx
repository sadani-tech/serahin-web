import Link from "next/link";
import { api } from "@/lib/api";
import { Card, EmptyState, Select } from "@/components/ui";
import { VerificationTable, type VerificationRow } from "./VerificationTable";
import { PaymentVerificationTable, type PaymentVerificationRow } from "./PaymentVerificationTable";

export const dynamic = "force-dynamic";

type Campaign = { id: string; namaProduk: string; variants: { id: string; namaVarian: string }[] };
type Envelope<T> = { data: T[]; meta: { page: number; totalPages: number; total: number } };
type Params = { tab?: string; campaignId?: string; variantId?: string; paymentType?: string; q?: string; page?: string };

export default async function VerificationPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const tab = sp.tab === "payments" ? "payments" : "orders";
  const page = Math.max(1, Number(sp.page) || 1);
  const [campaigns, queue] = await Promise.all([
    api.list<Campaign>("/pre-orders"),
    tab === "payments"
      ? api.get<Envelope<PaymentVerificationRow>>("/payments/pending", { campaignId: sp.campaignId, paymentType: sp.paymentType, search: sp.q, page, limit: 25 })
      : api.get<Envelope<VerificationRow>>("/pesanan-verifikasi", { campaignId: sp.campaignId, variantId: sp.variantId, page, limit: 25 }),
  ]);
  const selectedCampaign = campaigns.find((campaign) => campaign.id === sp.campaignId);
  const ordersQueue = queue as Envelope<VerificationRow>;
  const paymentsQueue = queue as Envelope<PaymentVerificationRow>;
  const tabQuery = (next: string) => ({ tab: next, ...(sp.campaignId ? { campaignId: sp.campaignId } : {}) });

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-sand-900">Verifikasi</h1><p className="mt-1 text-sm text-sand-500">Tinjau pesanan baru dan pembayaran manual yang membutuhkan keputusan.</p></div>
    <div className="flex gap-2 border-b border-sand-200">
      <Link href={{ pathname: "/verifikasi", query: tabQuery("orders") }} className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${tab === "orders" ? "border-brand-600 text-brand-700" : "border-transparent text-sand-500"}`}>Pesanan baru</Link>
      <Link href={{ pathname: "/verifikasi", query: tabQuery("payments") }} className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${tab === "payments" ? "border-brand-600 text-brand-700" : "border-transparent text-sand-500"}`}>Pembayaran</Link>
    </div>

    <Card className="p-4"><form className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value={tab} />
      {tab === "payments" && <label className="min-w-56 flex-1 text-sm">Cari Buyer atau pesanan<input name="q" defaultValue={sp.q ?? ""} placeholder="Nama, email, telepon, ID pesanan" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 text-sm" /></label>}
      <label className="text-sm">Batch PO<Select name="campaignId" defaultValue={sp.campaignId ?? ""} className="mt-1 block"><option value="">Semua Batch PO</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.namaProduk}</option>)}</Select></label>
      {tab === "orders" ? <label className="text-sm">Varian<Select name="variantId" defaultValue={sp.variantId ?? ""} className="mt-1 block"><option value="">Semua varian</option>{selectedCampaign?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.namaVarian}</option>)}</Select></label> : <label className="text-sm">Jenis pembayaran<Select name="paymentType" defaultValue={sp.paymentType ?? ""} className="mt-1 block"><option value="">Semua jenis</option><option value="DOWN_PAYMENT">DP</option><option value="SETTLEMENT">Pelunasan</option><option value="FULL_PAYMENT">Lunas</option></Select></label>}
      <button className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-brand">Terapkan</button>
      {(sp.campaignId || sp.variantId || sp.paymentType || sp.q) && <Link className="py-2 text-sm text-sand-500" href={`/verifikasi?tab=${tab}`}>Reset</Link>}
    </form></Card>

    <Card>{queue.data.length
      ? tab === "payments" ? <PaymentVerificationTable rows={paymentsQueue.data} /> : <VerificationTable rows={ordersQueue.data} />
      : <EmptyState title="Antrean kosong" description={tab === "payments" ? "Tidak ada pembayaran manual yang menunggu verifikasi." : "Tidak ada pesanan baru untuk filter ini."} />}
    </Card>
    {queue.meta.totalPages > 1 && <div className="flex justify-between text-sm">
      <PageLink disabled={page <= 1} sp={sp} page={page - 1}>Sebelumnya</PageLink>
      <span>Halaman {page} dari {queue.meta.totalPages} · {queue.meta.total} data</span>
      <PageLink disabled={page >= queue.meta.totalPages} sp={sp} page={page + 1}>Berikutnya</PageLink>
    </div>}
  </div>;
}

function PageLink({ disabled, sp, page, children }: { disabled: boolean; sp: Params; page: number; children: React.ReactNode }) {
  return <Link aria-disabled={disabled} className={disabled ? "pointer-events-none text-sand-300" : "font-bold text-brand-700"} href={{ pathname: "/verifikasi", query: { ...sp, page } }}>{children}</Link>;
}
