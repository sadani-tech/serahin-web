import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getSession } from "@/lib/session";

type StatusGroup = "ALL" | "TO_PAY" | "PROCESSING" | "TO_SHIP" | "SHIPPED" | "COMPLETED" | "CANCELLED";
type Dashboard = {
  summary: {
    total: number; active: number; awaitingPayment: number; completed: number;
    toPay: number; processing: number; toShip: number; shipped: number; cancelled: number;
  };
  activeStatusGroup: StatusGroup;
  orders: Array<{
    id: string; status: string; createdAt: string;
    salesEvent: { title: string };
    items: Array<{ quantity: number; unitPrice: string; variantNameSnapshot?: string }>;
    billing: { total: number; paid: number; pending: number; remaining: number };
  }>;
  pagination: { page: number; total: number; totalPages: number };
};

const STATUS: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Menunggu konfirmasi", className: "bg-sand-100 text-sand-700" },
  AWAITING_DOWN_PAYMENT: { label: "Belum bayar", className: "bg-sun-100 text-sun-800" },
  DOWN_PAYMENT_RECEIVED: { label: "DP diterima", className: "bg-brand-100 text-brand-800" },
  PAID: { label: "Lunas", className: "bg-brand-100 text-brand-800" },
  IN_PRODUCTION: { label: "Sedang diproses", className: "bg-accent-100 text-accent-700" },
  READY_TO_SHIP: { label: "Siap dikirim", className: "bg-accent-100 text-accent-700" },
  SHIPPED: { label: "Dalam pengiriman", className: "bg-sky-100 text-sky-700" },
  COMPLETED: { label: "Selesai", className: "bg-brand-50 text-brand-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
};

const FILTERS = [
  { key: "ALL", label: "Semua", summary: "total", icon: "list" },
  { key: "TO_PAY", label: "Belum Bayar", summary: "toPay", icon: "card" },
  { key: "PROCESSING", label: "Diproses", summary: "processing", icon: "box" },
  { key: "TO_SHIP", label: "Siap Dikirim", summary: "toShip", icon: "box" },
  { key: "SHIPPED", label: "Dikirim", summary: "shipped", icon: "truck" },
  { key: "COMPLETED", label: "Selesai", summary: "completed", icon: "check" },
  { key: "CANCELLED", label: "Batal", summary: "cancelled", icon: "x" },
] as const satisfies ReadonlyArray<{ key: StatusGroup; label: string; summary: keyof Dashboard["summary"]; icon: "card" | "box" | "truck" | "check" | "x" | "list" }>;

function StatusIcon({ name }: { name: (typeof FILTERS)[number]["icon"] }) {
  if (name === "card") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>;
  if (name === "truck") return <svg viewBox="0 0 24 24"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if (name === "check") return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>;
  if (name === "x") return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>;
  if (name === "list") return <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="m4 8 8-4 8 4-8 4zM4 8v9l8 4 8-4V8M12 12v9"/></svg>;
}

function accountHref(group: StatusGroup, page = 1) {
  const params = new URLSearchParams();
  if (group !== "ALL") params.set("status", group);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/account?${query}` : "/account";
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const requestedStatus = FILTERS.some((item) => item.key === query.status) ? query.status as StatusGroup : "ALL";
  const [data, session] = await Promise.all([
    api.get<Dashboard>("/buyer/dashboard", { page, limit: 10, statusGroup: requestedStatus === "ALL" ? undefined : requestedStatus }),
    getSession(),
  ]);
  const firstName = session?.name?.trim().split(/\s+/)[0] || "Buyer";
  const activeFilter = FILTERS.find((item) => item.key === data.activeStatusGroup) ?? FILTERS[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-7 text-white shadow-brand sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-100">Pesanan Saya</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Halo, {firstName}!</h1>
            <p className="mt-2 text-sm text-brand-50">Cek yang perlu dibayar, sedang diproses, hingga tiba di tanganmu.</p>
          </div>
          <Link href="/catalog" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-extrabold text-brand-700 shadow-sm transition hover:bg-brand-50">Belanja lagi <span className="ml-2" aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section aria-label="Status pesanan" className="relative z-10 -mt-3 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-md sm:-mt-4">
        <div className="grid min-w-[680px] grid-cols-7 divide-x divide-sand-100">
          {FILTERS.map((item) => {
            const active = item.key === data.activeStatusGroup;
            const count = data.summary[item.summary];
            return <Link key={item.key} href={accountHref(item.key)} aria-current={active ? "page" : undefined} className={`relative flex min-h-28 flex-col items-center justify-center gap-2 px-2 text-center transition hover:bg-brand-50 ${active ? "bg-brand-50 text-brand-700" : "text-sand-600"}`}>
              {count > 0 && <span className="absolute right-[calc(50%-25px)] top-3 min-w-5 rounded-full bg-sun-400 px-1.5 py-0.5 text-[10px] font-extrabold leading-4 text-sand-900">{count}</span>}
              <span className={`h-7 w-7 [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 ${active ? "text-brand-700" : "text-sand-500"}`}><StatusIcon name={item.icon} /></span>
              <span className="text-xs font-extrabold">{item.label}</span>
              {active && <span className="absolute inset-x-5 bottom-0 h-1 rounded-t-full bg-brand-600" />}
            </Link>;
          })}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{activeFilter.label}</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900">Daftar pesanan</h2></div>
          <span className="text-xs font-semibold text-sand-500">{data.pagination.total} pesanan</span>
        </div>

        {data.orders.length ? <div className="space-y-3">{data.orders.map((order) => {
          const status = STATUS[order.status] ?? { label: order.status, className: "bg-sand-100 text-sand-700" };
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const action = order.status === "AWAITING_DOWN_PAYMENT" || order.status === "SUBMITTED" ? "Bayar sekarang" : "Lihat detail";
          return <article key={order.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-3 border-b border-sand-100 bg-sand-50/70 px-4 py-3 sm:px-5">
              <p className="text-xs font-bold text-sand-500">Dipesan {formatTanggal(order.createdAt)}</p>
              <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold ${status.className}`}>{status.label}</span>
            </div>
            <div className="p-4 sm:p-5">
              <Link href={`/account/orders/${order.id}`} className="block text-base font-extrabold text-sand-900 hover:text-brand-700">{order.salesEvent.title}</Link>
              <p className="mt-1 text-sm text-sand-500">{itemCount} item{order.items[0]?.variantNameSnapshot ? ` · ${order.items[0].variantNameSnapshot}` : ""}</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-sand-100 pt-4">
                <div><p className="text-[0.68rem] font-bold uppercase tracking-wide text-sand-400">Total pesanan</p><p className="mt-0.5 text-xl font-extrabold text-brand-700">{formatRupiah(order.billing.total)}</p>{order.billing.remaining > 0 && <p className="mt-1 text-xs font-semibold text-sun-800">Sisa pembayaran {formatRupiah(order.billing.remaining)}</p>}</div>
                <Link href={`/account/orders/${order.id}`} className="inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white hover:bg-brand-700">{action}</Link>
              </div>
            </div>
          </article>;
        })}</div> : <div className="rounded-2xl border border-dashed border-sand-300 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 text-brand-600 [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.5]"><StatusIcon name={activeFilter.icon} /></div>
          <p className="mt-4 text-lg font-extrabold text-sand-900">Belum ada pesanan di status ini</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-sand-500">Pilih status lain atau temukan produk baru dari katalog Serahin.</p>
          <Link href="/catalog" className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white hover:bg-brand-700">Lihat katalog</Link>
        </div>}
      </section>

      {data.pagination.totalPages > 1 && <nav aria-label="Navigasi halaman pesanan" className="mt-7 flex items-center justify-center gap-3 text-sm font-bold">
        {page > 1 ? <Link className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sand-700 hover:border-brand-300" href={accountHref(data.activeStatusGroup, page - 1)}>← Sebelumnya</Link> : <span />}
        <span className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">{page} / {data.pagination.totalPages}</span>
        {page < data.pagination.totalPages ? <Link className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sand-700 hover:border-brand-300" href={accountHref(data.activeStatusGroup, page + 1)}>Berikutnya →</Link> : <span />}
      </nav>}
    </main>
  );
}
