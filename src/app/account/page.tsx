import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getSession } from "@/lib/session";

type Dashboard = {
  summary: { total: number; active: number; awaitingPayment: number; completed: number };
  orders: Array<{
    id: string;
    status: string;
    createdAt: string;
    salesEvent: { title: string };
    items: Array<{ quantity: number; unitPrice: string }>;
    billing: { total: number; paid: number; pending: number; remaining: number };
  }>;
  pagination: { page: number; totalPages: number };
};

const STATUS: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Baru masuk", className: "bg-sand-100 text-sand-700" },
  AWAITING_DOWN_PAYMENT: { label: "Menunggu DP", className: "bg-sun-100 text-sun-800" },
  DOWN_PAYMENT_RECEIVED: { label: "DP diterima", className: "bg-brand-100 text-brand-800" },
  PAID: { label: "Lunas", className: "bg-brand-100 text-brand-800" },
  IN_PRODUCTION: { label: "Produksi", className: "bg-accent-100 text-accent-700" },
  READY_TO_SHIP: { label: "Siap kirim", className: "bg-accent-100 text-accent-700" },
  SHIPPED: { label: "Dikirim", className: "bg-brand-100 text-brand-800" },
  COMPLETED: { label: "Selesai", className: "bg-sand-100 text-sand-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
};

const STAT_CARDS = [
  { key: "total", label: "Total pesanan", icon: "▦", iconClass: "bg-brand-100 text-brand-700" },
  { key: "active", label: "Sedang berjalan", icon: "↗", iconClass: "bg-accent-100 text-accent-700" },
  { key: "awaitingPayment", label: "Perlu pembayaran", icon: "Rp", iconClass: "bg-sun-100 text-sun-800" },
  { key: "completed", label: "Selesai", icon: "✓", iconClass: "bg-sand-100 text-sand-700" },
] as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [data, session] = await Promise.all([
    api.get<Dashboard>("/buyer/dashboard", { page, limit: 10 }),
    getSession(),
  ]);
  const firstName = session?.name?.trim().split(/\s+/)[0] || "Buyer";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-7 text-white shadow-brand sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-sun-400/15" />
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-100">Portal Buyer</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Halo, {firstName}!</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-brand-50 sm:text-base">Pantau pesanan, pembayaran, dan perjalanan produkmu dari satu tempat.</p>
          <Link href="/#catalog" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-brand-700 shadow-sm transition hover:bg-brand-50">Jelajahi katalog <span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>

      <section aria-label="Ringkasan pesanan" className="relative z-10 -mt-4 grid grid-cols-2 gap-3 px-1 sm:-mt-5 sm:grid-cols-4 sm:gap-4">
        {STAT_CARDS.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-sand-200/80 bg-white p-4 shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-extrabold ${stat.iconClass}`} aria-hidden="true">{stat.icon}</span>
              <span className="text-2xl font-extrabold leading-none text-sand-900">{data.summary[stat.key]}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-sand-500">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Aktivitas terbaru</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">Pesanan kamu</h2></div>
          <span className="text-xs font-semibold text-sand-500">{data.summary.total} pesanan</span>
        </div>

        {data.orders.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.orders.map((order) => {
              const status = STATUS[order.status] ?? { label: order.status, className: "bg-sand-100 text-sand-700" };
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="group relative overflow-hidden rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-sun-400" />
                  <div className="flex items-start justify-between gap-3 pl-2"><div className="min-w-0"><p className="truncate text-base font-extrabold text-sand-900 group-hover:text-brand-700">{order.salesEvent.title}</p><p className="mt-1 text-xs font-medium text-sand-500">{formatTanggal(order.createdAt)} · {itemCount} item</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold ${status.className}`}>{status.label}</span></div>
                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-sand-100 pl-2 pt-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-wide text-sand-400">Total pesanan</p><p className="mt-0.5 text-lg font-extrabold text-brand-700">{formatRupiah(order.billing.total)}</p></div><div className="text-right text-xs font-semibold text-sand-500">{order.billing.remaining === 0 ? <span className="text-brand-700">Pembayaran lunas</span> : <span>Sisa {formatRupiah(order.billing.remaining)}</span>}<span className="mt-1 block text-brand-700 opacity-0 transition group-hover:opacity-100">Lihat detail →</span></div></div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white px-6 py-12 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-700">▦</div><p className="mt-4 text-lg font-extrabold text-sand-900">Belum ada pesanan</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-sand-500">Temukan produk yang kamu suka dan mulai pre-order pertamamu.</p><Link href="/#catalog" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white shadow-brand hover:bg-brand-700">Lihat katalog</Link></div>
        )}
      </section>

      {data.pagination.totalPages > 1 && <nav aria-label="Navigasi halaman pesanan" className="mt-7 flex items-center justify-center gap-3 text-sm font-bold">{page > 1 ? <Link className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sand-700 hover:border-brand-300" href={`/account?page=${page - 1}`}>← Sebelumnya</Link> : <span />}<span className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">{page} / {data.pagination.totalPages}</span>{page < data.pagination.totalPages ? <Link className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sand-700 hover:border-brand-300" href={`/account?page=${page + 1}`}>Berikutnya →</Link> : <span />}</nav>}
    </main>
  );
}
