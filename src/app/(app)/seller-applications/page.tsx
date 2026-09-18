import { api } from "@/lib/api";
import { approveSeller, reactivateSeller, rejectSeller, resendSellerActivation, suspendSeller } from "./actions";

type Seller = { id: string; slug: string; businessName: string; description: string; contactEmail: string | null; contactPhone: string | null; status: "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED"; statusReason: string | null; registeredAt: string; account: { email: string; isActive: boolean; emailVerifiedAt: string | null } | null };
type Overview = { sellers: Record<string, number>; orders: number; gatewayPayments: number; rejectedWebhookNotifications: number };
const statusLabel: Record<Seller["status"], string> = { PENDING_APPROVAL: "Menunggu persetujuan", ACTIVE: "Aktif", REJECTED: "Ditolak", SUSPENDED: "Disuspend" };

export const dynamic = "force-dynamic";

export default async function SellerApplicationsPage() {
  const [result, overview] = await Promise.all([
    api.get<{ data: Seller[]; meta: { total: number } }>("/sellers/applications", { limit: 100 }),
    api.get<Overview>("/platform/overview"),
  ]);
  return <div className="space-y-6">
    <header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand-700">Platform Owner</p><h1 className="mt-1 text-3xl font-extrabold text-sand-900">Aplikasi Seller</h1><p className="mt-2 text-sm text-sand-600">Tinjau onboarding dan kendalikan status Seller tanpa menghapus riwayat operasional.</p></header>
    <section className="grid gap-3 sm:grid-cols-4"><Stat label="Total aplikasi" value={result.meta.total}/><Stat label="Seller aktif" value={overview.sellers.ACTIVE ?? 0}/><Stat label="Pesanan" value={overview.orders}/><Stat label="Webhook ditolak" value={overview.rejectedWebhookNotifications}/></section>
    <section className="space-y-4">
      {result.data.length === 0 && <div className="rounded-2xl border border-sand-200 bg-white p-8 text-center text-sand-500">Belum ada aplikasi Seller.</div>}
      {result.data.map((seller) => <article key={seller.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold text-sand-900">{seller.businessName}</h2><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{statusLabel[seller.status]}</span></div><p className="mt-1 text-sm font-semibold text-sand-500">{seller.contactEmail} · {seller.contactPhone} · /s/{seller.slug}</p><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-sand-700">{seller.description}</p>{seller.statusReason && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">Alasan: {seller.statusReason}</p>}</div><time className="text-xs font-semibold text-sand-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(seller.registeredAt))}</time></div>
        <div className="mt-5 border-t border-sand-100 pt-4">
          {seller.status === "PENDING_APPROVAL" && <div className="flex flex-wrap gap-3"><form action={approveSeller.bind(null, seller.id)}><button className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white">Setujui & kirim aktivasi</button></form><form action={rejectSeller.bind(null, seller.id)} className="flex flex-1 flex-wrap gap-2"><input name="reason" required placeholder="Alasan penolakan" className="min-h-11 min-w-52 flex-1 rounded-xl border border-sand-300 px-3 text-sm"/><button className="min-h-11 rounded-xl border border-rose-300 px-4 text-sm font-bold text-rose-700">Tolak</button></form></div>}
          {seller.status === "ACTIVE" && <div className="flex flex-wrap gap-3">{(!seller.account || !seller.account.emailVerifiedAt) && <form action={resendSellerActivation.bind(null, seller.id)}><button className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white">Kirim ulang aktivasi</button></form>}<form action={suspendSeller.bind(null, seller.id)} className="flex flex-1 flex-wrap gap-2"><input name="reason" required placeholder="Alasan suspend" className="min-h-11 min-w-52 flex-1 rounded-xl border border-sand-300 px-3 text-sm"/><button className="min-h-11 rounded-xl border border-rose-300 px-4 text-sm font-bold text-rose-700">Suspend Seller</button></form></div>}
          {seller.status === "SUSPENDED" && <form action={reactivateSeller.bind(null, seller.id)}><button className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white">Aktifkan kembali</button></form>}
        </div>
      </article>)}
    </section>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-sand-900">{value}</p></div>;
}
