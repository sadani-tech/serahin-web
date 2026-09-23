import Link from "next/link";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatRupiah, formatTanggal } from "@/lib/format";
import PembeliTable, { type PembeliMeta, type PembeliRow } from "@/components/PembeliTable";
import { Select } from "@/components/ui";

export const dynamic = "force-dynamic";
type Params = { search?: string; campaignId?: string; status?: string; page?: string; limit?: string; sort?: string; order?: string };
type Buyer = { id: string; name: string; email: string | null; phone: string | null; isActive: boolean; createdAt: string; orderCount: number; totalPurchase: number; lastTransactionAt: string | null };
type Meta = { page: number; limit: number; total: number; totalPages: number };

export default async function PembeliPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [sp, session] = await Promise.all([searchParams, getSession()]);
  if (session?.role === "ADMIN") return <AdminBuyerList sp={sp} />;
  const [campaigns, res] = await Promise.all([
    api.list<{ id: string; namaProduk: string }>("/pre-orders"),
    api.get<{ data: PembeliRow[]; meta: PembeliMeta }>("/pembeli", sp),
  ]);
  return <div className="space-y-6"><header><h1 className="text-2xl font-extrabold text-sand-900">Pembeli</h1><p className="mt-1 text-sm text-sand-500">Kontak pembeli dari Batch PO milik Anda.</p></header><PembeliTable rows={res.data} meta={res.meta} campaigns={campaigns} filters={{ search: sp.search ?? "", campaignId: sp.campaignId ?? "", status: sp.status ?? "", sort: sp.sort ?? "createdAt", order: sp.order === "asc" ? "asc" : "desc" }}/></div>;
}

async function AdminBuyerList({ sp }: { sp: Params }) {
  const res = await api.get<{ data: Buyer[]; meta: Meta }>("/admin/buyers", { search: sp.search, status: sp.status, page: sp.page, limit: sp.limit, sort: sp.sort, order: sp.order });
  return <div className="space-y-6"><header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Admin internal</p><h1 className="mt-1 text-3xl font-extrabold text-sand-900">Pembeli</h1><p className="mt-1 text-sm text-sand-500">Kelola akun Buyer, profil, dan histori pembelian lintas Seller.</p></header>
    <form className="grid gap-3 rounded-2xl border border-sand-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto_auto]"><input name="search" defaultValue={sp.search} placeholder="Cari nama, email, atau telepon" className="min-h-11 rounded-xl border border-sand-300 px-3"/><Select name="status" defaultValue={sp.status ?? ""} className="min-h-11"><option value="">Semua status</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></Select><Select name="sort" defaultValue={sp.sort ?? "createdAt"} aria-label="Urutkan pembeli" className="min-h-11"><option value="createdAt">Tanggal bergabung</option><option value="name">Nama</option><option value="lastLoginAt">Login terakhir</option><option value="updatedAt">Pembaruan terakhir</option></Select><Select name="order" defaultValue={sp.order === "asc" ? "asc" : "desc"} aria-label="Arah urutan" className="min-h-11"><option value="desc">Terbaru/Z-A</option><option value="asc">Terlama/A-Z</option></Select><div className="flex gap-2"><Select name="limit" defaultValue={sp.limit ?? "20"} aria-label="Jumlah data per halaman" className="min-h-11"><option value="20">20/baris</option><option value="50">50/baris</option><option value="100">100/baris</option></Select><button className="min-h-11 rounded-xl bg-brand-600 px-5 font-bold text-white">Terapkan</button></div></form>
    <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-cream-soft text-left text-xs uppercase tracking-wide text-sand-500"><tr><th className="p-4">Pembeli</th><th className="p-4">Status</th><th className="p-4">Pesanan</th><th className="p-4">Nilai pembelian</th><th className="p-4">Transaksi terakhir</th></tr></thead><tbody className="divide-y divide-sand-100">{res.data.map((buyer) => <tr key={buyer.id} className="hover:bg-sand-50"><td className="p-4"><Link href={`/pembeli/${buyer.id}`} className="font-extrabold text-brand-700 hover:underline">{buyer.name}</Link><p className="text-xs text-sand-500">{buyer.email ?? "Tanpa email"} · {buyer.phone ?? "Tanpa telepon"}</p></td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${buyer.isActive ? "bg-emerald-100 text-emerald-800" : "bg-sand-100 text-sand-600"}`}>{buyer.isActive ? "Aktif" : "Nonaktif"}</span></td><td className="p-4 font-bold">{buyer.orderCount}</td><td className="p-4 font-bold">{formatRupiah(buyer.totalPurchase)}</td><td className="p-4 text-sand-600">{buyer.lastTransactionAt ? formatTanggal(buyer.lastTransactionAt) : "—"}</td></tr>)}</tbody></table>{res.data.length === 0 && <p className="p-10 text-center text-sand-500">Tidak ada Buyer yang sesuai filter.</p>}</div>
    <Pagination base="/pembeli" meta={res.meta} sp={sp}/>
  </div>;
}

function Pagination({ base, meta, sp }: { base: string; meta: Meta; sp: Params }) { const href=(page:number)=>`${base}?${new URLSearchParams({ ...(sp.search ? {search:sp.search}:{}), ...(sp.status ? {status:sp.status}:{}), ...(sp.sort ? {sort:sp.sort}:{}), ...(sp.order ? {order:sp.order}:{}), page:String(page), limit:String(meta.limit) }).toString()}`; return <div className="flex items-center justify-between text-sm text-sand-600"><span>{meta.total} data · halaman {meta.page}/{meta.totalPages}</span><div className="flex gap-2">{meta.page>1&&<Link href={href(meta.page-1)} className="rounded-xl border border-sand-300 px-3 py-2 font-bold">Sebelumnya</Link>}{meta.page<meta.totalPages&&<Link href={href(meta.page+1)} className="rounded-xl border border-sand-300 px-3 py-2 font-bold">Berikutnya</Link>}</div></div> }
