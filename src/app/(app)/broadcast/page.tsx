import Link from "next/link";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatTanggal } from "@/lib/format";
import { BroadcastComposer } from "./BroadcastComposer";
import { Status } from "./BroadcastStatus";
import { cancelBroadcast, loadBroadcastOptions, retryBroadcast, type BroadcastOptions } from "./actions";

export const dynamic = "force-dynamic";
type Broadcast = { id: string; name: string; purpose: string; subject: string; status: string; recipientCount: number; sentCount: number; failedCount: number; skippedCount: number; createdAt: string; seller?: { businessName: string } | null };
type Seller = { id: string; businessName: string };

export default async function BroadcastPage() {
  const session = await getSession();
  const [history, sellersResult] = await Promise.all([
    api.get<{ data: Broadcast[]; meta: { total: number } }>("/broadcasts", { limit: 20 }),
    session?.role === "ADMIN" ? api.get<{ data: Seller[] }>("/admin/sellers", { status: "ACTIVE", limit: 100 }) : Promise.resolve({ data: [] }),
  ]);
  let initialOptions: BroadcastOptions | undefined;
  if (session?.role === "SELLER") initialOptions = (await loadBroadcastOptions()).data;
  return <div className="space-y-7 pb-8">
    <header className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-100">Email operasional</p><h1 className="mt-2 text-3xl font-extrabold">Broadcast</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Kirim informasi penting kepada Buyer sesuai Batch PO, produk, dan status pembayarannya.</p></header>
    <BroadcastComposer sellers={sellersResult.data.map((seller) => ({ id: seller.id, name: seller.businessName }))} initialOptions={initialOptions}/>
    <section className="space-y-4"><div><h2 className="text-xl font-extrabold text-sand-900">Riwayat broadcast</h2><p className="mt-1 text-sm text-sand-500">Lihat progres dan tindak lanjuti pengiriman yang gagal.</p></div>
      {history.data.length ? <><div className="grid gap-3 md:hidden">{history.data.map((item) => <article key={item.id} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-extrabold text-sand-900">{item.name}</h3><p className="mt-1 line-clamp-2 text-sm text-sand-500">{item.subject}</p></div><Status value={item.status}/></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-sand-50 p-3 text-xs"><div><span className="text-sand-500">Terkirim</span><b className="mt-1 block text-base text-sand-900">{item.sentCount}/{item.recipientCount}</b></div><div><span className="text-sand-500">Dibuat</span><b className="mt-1 block text-sand-900">{formatTanggal(item.createdAt)}</b></div></div><div className="mt-3 flex flex-wrap items-center gap-2"><Link href={`/broadcast/${item.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-brand-300 px-4 text-sm font-bold text-brand-700">Lihat detail</Link><BroadcastActions item={item}/></div></article>)}</div><div className="hidden overflow-x-auto rounded-2xl border border-sand-200 bg-white md:block"><table className="min-w-full text-sm"><thead className="bg-cream-soft text-left text-xs uppercase text-sand-500"><tr><th className="p-4">Broadcast</th><th className="p-4">Status</th><th className="p-4">Progres</th><th className="p-4">Dibuat</th><th className="p-4">Aksi</th></tr></thead><tbody className="divide-y divide-sand-100">{history.data.map((item) => <tr key={item.id}><td className="p-4"><b>{item.name}</b><p className="text-xs text-sand-500">{item.seller?.businessName ?? "Serahin"} · {item.subject}</p></td><td className="p-4"><Status value={item.status}/></td><td className="p-4"><b>{item.sentCount}/{item.recipientCount}</b><p className="text-xs text-sand-500">{item.failedCount} gagal · {item.skippedCount} dilewati</p></td><td className="p-4">{formatTanggal(item.createdAt)}</td><td className="p-4"><div className="flex items-center gap-2"><Link href={`/broadcast/${item.id}`} className="font-bold text-brand-700">Detail</Link><BroadcastActions item={item}/></div></td></tr>)}</tbody></table></div></> : <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-sand-500">Belum ada broadcast. Buat pesan pertama di formulir atas.</div>}
    </section>
  </div>;
}

function BroadcastActions({ item }: { item: Broadcast }) {
  return <>{["READY", "SENDING"].includes(item.status) && <form action={cancelBroadcast.bind(null, item.id)}><button className="min-h-11 rounded-xl border border-sand-300 px-3 text-xs font-bold text-sand-700">Batalkan</button></form>}{item.status === "PARTIAL_FAILED" && <form action={retryBroadcast.bind(null, item.id)}><button className="min-h-11 rounded-xl bg-brand-600 px-3 text-xs font-bold text-white">Ulangi gagal</button></form>}</>;
}
