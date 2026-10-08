import Link from "next/link";
import { api } from "@/lib/api";
import { Card, EmptyState, Select } from "@/components/ui";
import { ORDER_STATUS_LABEL } from "@/lib/domain";
import type { OrderStatus } from "@/lib/types";
import { AllOrdersTable, type AllOrdersRow } from "./AllOrdersTable";

// Tabel pesanan lintas Batch PO (v2.3.9 FR-42.5) — sebelumnya route ini
// hanya redirect ke /pre-orders tanpa cara melihat pesanan tanpa masuk ke
// satu Batch PO dulu.
export const dynamic = "force-dynamic";

type Params = { q?: string; status?: string; payment?: string; campaignId?: string; page?: string; limit?: string };
type Envelope = {
  data: AllOrdersRow[];
  meta: { page: number; totalPages: number; total: number; limit: number };
  filters: { campaigns: { id: string; namaProduk: string }[] };
};

export default async function PesananPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = [10, 25, 50, 100].includes(Number(sp.limit)) ? Number(sp.limit) : 10;
  const envelope = await api.get<Envelope>("/pesanan", {
    search: sp.q,
    orderStatus: sp.status,
    paymentStatus: sp.payment,
    campaignId: sp.campaignId,
    page,
    limit,
  });
  const hasFilter = !!sp.q || !!sp.status || !!sp.payment || !!sp.campaignId;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-sand-900">Pesanan</h1><p className="mt-1 text-sm text-sand-500">Seluruh pesanan lintas Batch PO.</p></div>

    <Card className="p-4"><form className="flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1 text-sm">Cari Buyer, kontak, atau ID pesanan<input name="q" defaultValue={sp.q ?? ""} placeholder="Nama, email, telepon, ID pesanan" className="mt-1 block min-h-11 w-full rounded-xl border border-sand-300 px-3 text-sm" /></label>
      <label className="text-sm">Batch PO<Select name="campaignId" defaultValue={sp.campaignId ?? ""} className="mt-1 block"><option value="">Semua Batch PO</option>{envelope.filters.campaigns.map((c) => <option key={c.id} value={c.id}>{c.namaProduk}</option>)}</Select></label>
      <label className="text-sm">Status<Select name="status" defaultValue={sp.status ?? ""} className="mt-1 block"><option value="">Semua status</option>{(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}</Select></label>
      <label className="text-sm">Pembayaran<Select name="payment" defaultValue={sp.payment ?? ""} className="mt-1 block"><option value="">Semua</option><option value="PENDING_VERIFICATION">Menunggu verifikasi</option><option value="VERIFIED">Terverifikasi</option><option value="REJECTED">Ditolak</option><option value="EXPIRED">Kedaluwarsa</option></Select></label>
      <button className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-brand">Terapkan</button>
      {hasFilter && <Link className="py-2 text-sm text-sand-500" href="/pesanan">Reset</Link>}
    </form></Card>

    <Card>{envelope.data.length
      ? <AllOrdersTable rows={envelope.data} />
      : <EmptyState title={hasFilter ? "Tidak ditemukan" : "Belum ada pesanan"} description={hasFilter ? "Tidak ada pesanan yang cocok dengan filter saat ini." : "Pesanan akan muncul di sini setelah ada pesanan masuk."} />}
    </Card>
    {envelope.meta.totalPages > 1 && <div className="flex justify-between text-sm">
      <PageLink disabled={page <= 1} sp={sp} page={page - 1}>Sebelumnya</PageLink>
      <span>Halaman {page} dari {envelope.meta.totalPages} · {envelope.meta.total} data</span>
      <PageLink disabled={page >= envelope.meta.totalPages} sp={sp} page={page + 1}>Berikutnya</PageLink>
    </div>}
  </div>;
}

function PageLink({ disabled, sp, page, children }: { disabled: boolean; sp: Params; page: number; children: React.ReactNode }) {
  return <Link aria-disabled={disabled} className={disabled ? "pointer-events-none text-sand-300" : "font-bold text-brand-700"} href={{ pathname: "/pesanan", query: { ...sp, page } }}>{children}</Link>;
}
