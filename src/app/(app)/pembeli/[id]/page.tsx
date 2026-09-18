import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { DestructiveActionForm } from "@/components/DestructiveActionForm";
import { archiveBuyer } from "../../management-actions";

type Detail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  summary: { orderCount: number; totalPurchase: number };
  orders: Array<{
    id: string;
    status: string;
    createdAt: string;
    salesEvent: { title: string; seller: { businessName: string } | null };
    items: Array<{ quantity: number; unitPrice: string }>;
    payments: Array<{ verificationStatus: string; amount: string }>;
  }>;
};

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let buyer: Detail;
  try {
    buyer = await api.get<Detail>(`/admin/buyers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link href="/pembeli" className="text-sm font-bold text-brand-700">← Daftar Pembeli</Link>
      <header>
        <h1 className="text-3xl font-extrabold text-sand-900">{buyer.name}</h1>
        <p className="mt-1 text-sm text-sand-500">
          {buyer.email ?? "Tanpa email"} · {buyer.phone ?? "Tanpa telepon"} · bergabung {formatTanggal(buyer.createdAt)}
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Status" value={buyer.isActive ? "Aktif" : "Nonaktif"} />
        <Stat label="Jumlah pesanan" value={buyer.summary.orderCount} />
        <Stat label="Total pembelian" value={formatRupiah(buyer.summary.totalPurchase)} />
      </section>
      <section className="rounded-2xl border border-sand-200 bg-white">
        <h2 className="border-b border-sand-100 p-4 text-lg font-extrabold">Histori pembelian</h2>
        <div className="divide-y divide-sand-100">
          {buyer.orders.map((order) => {
            const paymentStatus = order.payments.length
              ? [...new Set(order.payments.map((payment) => payment.verificationStatus))].join(", ")
              : "Belum ada pembayaran";
            const total = order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
            return (
              <Link key={order.id} href={`/pesanan/${order.id}`} className="flex justify-between gap-4 p-4 hover:bg-sand-50">
                <div>
                  <p className="font-bold">{order.salesEvent.title}</p>
                  <p className="text-xs text-sand-500">{order.salesEvent.seller?.businessName ?? "Serahin"} · {formatTanggal(order.createdAt)}</p>
                  <p className="mt-1 text-xs font-bold text-brand-700">Pembayaran: {paymentStatus}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRupiah(total)}</p>
                  <p className="text-xs text-sand-500">{order.status}</p>
                </div>
              </Link>
            );
          })}
          {buyer.orders.length === 0 && <p className="p-8 text-center text-sand-500">Belum ada transaksi.</p>}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-sand-900">Kontrol data</h2>
        <DestructiveActionForm action={archiveBuyer.bind(null, id)} target={buyer.email ?? buyer.name} />
        <p className="mt-2 text-xs text-sand-500">Buyer tanpa transaksi dihapus; Buyer dengan histori akan dinonaktifkan dan dianonimkan.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-sand-200 bg-white p-4"><p className="text-xs font-bold uppercase text-sand-500">{label}</p><p className="mt-1 text-xl font-extrabold text-sand-900">{value}</p></div>;
}
