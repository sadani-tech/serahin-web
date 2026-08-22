import Link from "next/link";
import { api } from "@/lib/api";
import { Card, EmptyState } from "@/components/ui";
import { VerificationTable, type VerificationRow } from "./VerificationTable";

export const dynamic = "force-dynamic";

type Campaign = { id: string; namaProduk: string; variants: { id: string; namaVarian: string }[] };
type Envelope = { data: VerificationRow[]; meta: { page: number; totalPages: number; total: number } };

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ campaignId?: string; variantId?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [queue, campaigns] = await Promise.all([
    api.get<Envelope>("/pesanan-verifikasi", { campaignId: sp.campaignId, variantId: sp.variantId, page }),
    api.list<Campaign>("/kampanye"),
  ]);
  const selectedCampaign = campaigns.find((campaign) => campaign.id === sp.campaignId);
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-sand-900">Antrian Verifikasi</h1><p className="mt-1 text-sm text-sand-500">Tinjau pesanan baru lintas kampanye. Pesanan mencurigakan ditampilkan lebih dahulu.</p></div>
    <Card className="p-4"><form className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Kampanye<select name="campaignId" defaultValue={sp.campaignId ?? ""} className="mt-1 block rounded-lg border border-sand-300 px-3 py-2"><option value="">Semua kampanye</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.namaProduk}</option>)}</select></label>
      <label className="text-sm">Varian<select name="variantId" defaultValue={sp.variantId ?? ""} className="mt-1 block rounded-lg border border-sand-300 px-3 py-2"><option value="">Semua varian</option>{selectedCampaign?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.namaVarian}</option>)}</select></label>
      <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Terapkan</button>
      {(sp.campaignId || sp.variantId) && <Link className="py-2 text-sm text-sand-500" href="/verifikasi">Reset</Link>}
    </form></Card>
    <Card>{queue.data.length ? <VerificationTable rows={queue.data} /> : <EmptyState title="Antrian kosong" description="Tidak ada pesanan Baru Masuk untuk filter ini." />}</Card>
    {queue.meta.totalPages > 1 && <div className="flex justify-between text-sm"><Link aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none text-sand-300" : "text-sand-700"} href={{ pathname: "/verifikasi", query: { ...sp, page: page - 1 } }}>Sebelumnya</Link><span>Halaman {page} dari {queue.meta.totalPages}</span><Link aria-disabled={page >= queue.meta.totalPages} className={page >= queue.meta.totalPages ? "pointer-events-none text-sand-300" : "text-sand-700"} href={{ pathname: "/verifikasi", query: { ...sp, page: page + 1 } }}>Berikutnya</Link></div>}
  </div>;
}
