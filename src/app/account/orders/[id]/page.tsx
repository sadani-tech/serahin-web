import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";

type BuyerOrder = {
  id: string; status: string; publicToken: string; createdAt: string;
  salesEvent: { title: string; timelineEntries: Array<{ id: string; title: string; notes: string | null; milestoneCode: string | null; createdAt: string }> };
  items: Array<{
    id: string; variantNameSnapshot: string; skuSnapshot: string | null; selectedColor: string | null; quantity: number; unitPrice: string;
    salesEventItem: {
      label: string | null;
      displayImages: string[];
      productVariant: { images: string[]; sku: string | null; size: string | null; description: string | null; colors: string[] };
    };
  }>;
  payments: Array<{ id: string; type: string; amount: string; verificationStatus: string; rejectionReason: string | null; occurredAt: string }>;
  shipment: { method: string; status: string; trackingNumber: string | null; courier: string | null; address: string | null } | null;
  billing: { total: number; downPaymentRequired: number; downPaymentVerified: number; settlement: number; paid: number; pending: number; rejected: number; remaining: number };
  nextAction: string;
  rejectionReason: string | null;
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

const PAYMENT_TYPE_LABEL: Record<string, string> = { DOWN_PAYMENT: "DP", SETTLEMENT: "Pelunasan", FULL_PAYMENT: "Pembayaran lunas" };
const PAYMENT_STATUS_LABEL: Record<string, string> = { PENDING_VERIFICATION: "Menunggu verifikasi", VERIFIED: "Terverifikasi", REJECTED: "Ditolak", EXPIRED: "Kedaluwarsa" };
const SHIPMENT_METHOD_LABEL: Record<string, string> = { SHOPEE: "Shopee", COURIER: "Manual/Ekspedisi" };
const SHIPMENT_STATUS_LABEL: Record<string, string> = { PENDING: "Belum dikirim", READY: "Siap dikirim", SHIPPED: "Dalam pengiriman", DELIVERED: "Terkirim" };
const NEXT_ACTION_LABEL: Record<string, string> = {
  PAY_DOWN_PAYMENT: "Bayar DP",
  WAIT_VERIFICATION: "Menunggu verifikasi pembayaran",
  REUPLOAD_PAYMENT: "Unggah ulang bukti pembayaran",
  PAY_SETTLEMENT: "Bayar pelunasan",
  COMPLETE_SHIPPING: "Lengkapi pengiriman",
  TRACK_SHIPMENT: "Lacak pesanan",
  NONE: "Tidak ada tindakan",
};

export default async function BuyerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await api.get<BuyerOrder>(`/buyer/orders/${id}`);
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <Link href="/account" className="text-sm font-bold text-brand-700">← Pesanan Saya</Link>
    <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-6">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-sand-900">{order.salesEvent.title}</h1><p className="text-sm text-sand-500">Dipesan {formatTanggal(order.createdAt)}</p></div><span className="h-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">{ORDER_STATUS_LABEL[order.status] ?? order.status}</span></div>
      <section className={`mt-5 rounded-2xl p-4 ${order.nextAction === "REUPLOAD_PAYMENT" ? "bg-rose-50 text-rose-900" : "bg-brand-50 text-brand-900"}`}>
        <p className="text-xs font-extrabold uppercase tracking-wider">Tindakan berikutnya</p>
        <p className="mt-1 text-lg font-extrabold">{NEXT_ACTION_LABEL[order.nextAction] ?? "Lihat status pesanan"}</p>
        {order.rejectionReason && <p className="mt-2 text-sm">Alasan: {order.rejectionReason}</p>}
        {!["WAIT_VERIFICATION", "NONE"].includes(order.nextAction) && <Link href={`/portal/${order.publicToken}`} className="mt-3 inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-extrabold text-white">Lanjutkan</Link>}
      </section>
      <h2 className="mt-6 font-extrabold">Item</h2>
      <div className="mt-2 divide-y">{order.items.map((item) => {
        const image = item.salesEventItem.displayImages[0] ?? item.salesEventItem.productVariant.images[0] ?? null;
        const sku = item.skuSnapshot ?? item.salesEventItem.productVariant.sku;
        return <div key={item.id} className="flex gap-3 py-3 text-sm">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={item.variantNameSnapshot} className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-sand-200" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-xs text-sand-400">—</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sand-900">
                {item.variantNameSnapshot}
                {item.salesEventItem.label && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">{item.salesEventItem.label}</span>}
              </p>
              <strong className="shrink-0">{formatRupiah(Number(item.unitPrice) * item.quantity)}</strong>
            </div>
            <p className="mt-0.5 text-xs text-sand-500">
              {item.selectedColor && `Warna: ${item.selectedColor} · `}
              {item.salesEventItem.productVariant.size && `Ukuran: ${item.salesEventItem.productVariant.size} · `}
              {sku && `SKU: ${sku} · `}
              {item.quantity} × {formatRupiah(Number(item.unitPrice))}
            </p>
            {item.salesEventItem.productVariant.description && (
              <p className="mt-1 whitespace-pre-wrap text-xs text-sand-500">{item.salesEventItem.productVariant.description}</p>
            )}
          </div>
        </div>;
      })}</div>
      <h2 className="mt-6 font-extrabold">Pembayaran</h2>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary label="Total harga" value={order.billing.total} />
        <Summary label="DP wajib" value={order.billing.downPaymentRequired} />
        <Summary label="DP terverifikasi" value={order.billing.downPaymentVerified} />
        <Summary label="Pelunasan" value={order.billing.settlement} />
        <Summary label="Sudah dibayar" value={order.billing.paid} />
        <Summary label="Menunggu" value={order.billing.pending} />
        <Summary label="Ditolak" value={order.billing.rejected} />
        <Summary label="Sisa tagihan" value={order.billing.remaining} strong />
      </dl>
      <div className="mt-3 space-y-2">{order.payments.length ? order.payments.map((payment) => <div key={payment.id} className="rounded-xl bg-cream-soft p-3 text-sm"><strong>{PAYMENT_TYPE_LABEL[payment.type] ?? "Pembayaran"}</strong> · {formatRupiah(Number(payment.amount))} · {PAYMENT_STATUS_LABEL[payment.verificationStatus] ?? "Diproses"}{payment.rejectionReason && <p className="mt-1 font-semibold text-rose-700">Alasan: {payment.rejectionReason}</p>}</div>) : <p className="text-sm text-sand-500">Belum ada pembayaran.</p>}</div>
      <h2 className="mt-6 font-extrabold">Pengiriman</h2>
      {order.shipment ? <div className="mt-2 rounded-xl bg-sand-50 p-3 text-sm text-sand-700"><p>{SHIPMENT_METHOD_LABEL[order.shipment.method] ?? "Pengiriman"} · {SHIPMENT_STATUS_LABEL[order.shipment.status] ?? "Diproses"}</p>{order.shipment.courier && <p>{order.shipment.courier}{order.shipment.trackingNumber ? ` · ${order.shipment.trackingNumber}` : ""}</p>}{order.shipment.address && <p>{order.shipment.address}</p>}</div> : <p className="mt-2 text-sm text-sand-500">Metode pengiriman belum dipilih.</p>}
      <h2 className="mt-6 font-extrabold">Progres pesanan</h2>
      <ol className="mt-2 space-y-3">{order.salesEvent.timelineEntries.length ? order.salesEvent.timelineEntries.map((entry) => <li key={entry.id} className="border-l-2 border-brand-300 pl-3 text-sm"><strong>{entry.title}</strong>{entry.milestoneCode && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">{MILESTONE_LABEL[entry.milestoneCode] ?? entry.milestoneCode}</span>}<p className="text-xs text-sand-500">{formatTanggal(entry.createdAt)}</p>{entry.notes && <p className="mt-1 text-sand-600">{entry.notes}</p>}</li>) : <li className="text-sm text-sand-500">Belum ada pembaruan.</li>}</ol>
      <div className="mt-6"><Link href={`/portal/${order.publicToken}`} className="inline-flex rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white">Buka pembayaran & status</Link></div>
    </div>
  </main>;
}

function Summary({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`rounded-xl border p-3 ${strong ? "border-brand-300 bg-brand-50" : "border-sand-100 bg-sand-50"}`}><dt className="text-[11px] font-bold uppercase tracking-wide text-sand-500">{label}</dt><dd className={`mt-1 text-sm ${strong ? "font-extrabold text-brand-800" : "font-bold text-sand-800"}`}>{formatRupiah(value)}</dd></div>;
}
