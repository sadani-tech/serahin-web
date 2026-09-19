import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";

type BuyerOrder = {
  id: string; status: string; publicToken: string; createdAt: string;
  salesEvent: { title: string; timelineEntries: Array<{ id: string; title: string; notes: string | null; milestoneCode: string | null; createdAt: string }> };
  items: Array<{ id: string; variantNameSnapshot: string; selectedColor: string | null; quantity: number; unitPrice: string }>;
  payments: Array<{ id: string; type: string; amount: string; verificationStatus: string; occurredAt: string }>;
  shipment: { method: string; status: string; trackingNumber: string | null; courier: string | null; address: string | null } | null;
};

const MILESTONE_LABEL: Record<string, string> = {
  OPEN: "Open", CLOSED: "Closed", PRODUCTION: "Produksi", SHIPMENT: "Shipment",
  PACKING: "Packing", DELIVERED: "Deliver", COMPLETED: "Selesai",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Menunggu konfirmasi",
  AWAITING_DOWN_PAYMENT: "Belum bayar",
  DOWN_PAYMENT_RECEIVED: "DP diterima",
  PAID: "Lunas",
  IN_PRODUCTION: "Diproses",
  READY_TO_SHIP: "Siap dikirim",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REJECTED: "Ditolak",
};

export default async function BuyerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await api.get<BuyerOrder>(`/buyer/orders/${id}`);
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <Link href="/account" className="text-sm font-bold text-brand-700">← Pesanan Saya</Link>
    <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-6">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-sand-900">{order.salesEvent.title}</h1><p className="text-sm text-sand-500">Dipesan {formatTanggal(order.createdAt)}</p></div><span className="h-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">{ORDER_STATUS_LABEL[order.status] ?? order.status}</span></div>
      <h2 className="mt-6 font-extrabold">Item</h2>
      <div className="mt-2 divide-y">{order.items.map((item) => <div key={item.id} className="flex justify-between py-3 text-sm"><span>{item.variantNameSnapshot}{item.selectedColor ? ` · ${item.selectedColor}` : ""} × {item.quantity}</span><strong>{formatRupiah(Number(item.unitPrice) * item.quantity)}</strong></div>)}</div>
      <h2 className="mt-6 font-extrabold">Pembayaran</h2>
      <div className="mt-2 space-y-2">{order.payments.length ? order.payments.map((payment) => <div key={payment.id} className="rounded-xl bg-cream-soft p-3 text-sm"><strong>{payment.type}</strong> · {formatRupiah(Number(payment.amount))} · {payment.verificationStatus}</div>) : <p className="text-sm text-sand-500">Belum ada pembayaran.</p>}</div>
      <h2 className="mt-6 font-extrabold">Pengiriman</h2>
      {order.shipment ? <div className="mt-2 rounded-xl bg-sand-50 p-3 text-sm text-sand-700"><p>{order.shipment.method} · {order.shipment.status}</p>{order.shipment.courier && <p>{order.shipment.courier}{order.shipment.trackingNumber ? ` · ${order.shipment.trackingNumber}` : ""}</p>}{order.shipment.address && <p>{order.shipment.address}</p>}</div> : <p className="mt-2 text-sm text-sand-500">Metode pengiriman belum dipilih.</p>}
      <h2 className="mt-6 font-extrabold">Progres pesanan</h2>
      <ol className="mt-2 space-y-3">{order.salesEvent.timelineEntries.length ? order.salesEvent.timelineEntries.map((entry) => <li key={entry.id} className="border-l-2 border-brand-300 pl-3 text-sm"><strong>{entry.title}</strong>{entry.milestoneCode && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">{MILESTONE_LABEL[entry.milestoneCode] ?? entry.milestoneCode}</span>}<p className="text-xs text-sand-500">{formatTanggal(entry.createdAt)}</p>{entry.notes && <p className="mt-1 text-sand-600">{entry.notes}</p>}</li>) : <li className="text-sm text-sand-500">Belum ada pembaruan.</li>}</ol>
      <div className="mt-6"><Link href={`/portal/${order.publicToken}`} className="inline-flex rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white">Buka pembayaran & status</Link></div>
    </div>
  </main>;
}
