import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatTanggal } from "@/lib/format";
import { BroadcastComposer } from "./BroadcastComposer";
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
  return <div className="space-y-8">
    <header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Email operasional</p><h1 className="mt-1 text-3xl font-extrabold text-sand-900">Broadcast</h1><p className="mt-1 text-sm text-sand-500">Beritahu Buyer yang tepat berdasarkan produk dan status pembayarannya.</p></header>
    <BroadcastComposer sellers={sellersResult.data.map((seller) => ({ id: seller.id, name: seller.businessName }))} initialOptions={initialOptions} />
    <section><h2 className="mb-4 text-xl font-extrabold text-sand-900">Riwayat broadcast</h2><div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-cream-soft text-left text-xs uppercase text-sand-500"><tr><th className="p-4">Broadcast</th><th className="p-4">Status</th><th className="p-4">Progress</th><th className="p-4">Dibuat</th><th className="p-4">Aksi</th></tr></thead><tbody className="divide-y divide-sand-100">{history.data.map((item) => <tr key={item.id}><td className="p-4"><b>{item.name}</b><p className="text-xs text-sand-500">{item.seller?.businessName ?? "Serahin"} · {item.subject}</p></td><td className="p-4"><Status value={item.status} /></td><td className="p-4"><b>{item.sentCount}/{item.recipientCount}</b><p className="text-xs text-sand-500">{item.failedCount} gagal · {item.skippedCount} dilewati</p></td><td className="p-4 text-sand-600">{formatTanggal(item.createdAt)}</td><td className="p-4"><div className="flex gap-2">{["READY", "SENDING"].includes(item.status) && <form action={cancelBroadcast.bind(null, item.id)}><button className="rounded-lg border border-sand-300 px-3 py-2 text-xs font-bold">Batalkan</button></form>}{item.status === "PARTIAL_FAILED" && <form action={retryBroadcast.bind(null, item.id)}><button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Ulangi gagal</button></form>}</div></td></tr>)}</tbody></table>{!history.data.length && <p className="p-10 text-center text-sand-500">Belum ada broadcast.</p>}</div></section>
  </div>;
}

function Status({ value }: { value: string }) { const label: Record<string, string> = { DRAFT: "Draft", READY: "Dalam antrean", SENDING: "Mengirim", COMPLETED: "Selesai", PARTIAL_FAILED: "Sebagian gagal", CANCELLED: "Dibatalkan" }; return <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{label[value] ?? value}</span>; }
