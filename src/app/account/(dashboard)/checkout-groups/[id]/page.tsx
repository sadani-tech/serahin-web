import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ProofViewerButton } from "@/components/ProofViewerButton";
import { CheckoutGroupUploadForm, type ManualTransferAccount } from "./CheckoutGroupUploadForm";

export const dynamic = "force-dynamic";

type CheckoutGroupDetail = {
  id: string;
  status: "AWAITING_PAYMENT" | "PENDING_VERIFICATION" | "PAID" | "REJECTED" | "CANCELLED";
  totalAmountTarget: number;
  paymentProofFile: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  orders: { orderId: string; publicToken: string; campaignTitle: string; status: string; allocatedAmount: number }[];
  manualTransfers: ManualTransferAccount[];
};

const STATUS_LABEL: Record<CheckoutGroupDetail["status"], string> = {
  AWAITING_PAYMENT: "Belum bayar",
  PENDING_VERIFICATION: "Menunggu verifikasi",
  PAID: "Lunas",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
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

export default async function CheckoutGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let group: CheckoutGroupDetail;
  try {
    group = await api.get<CheckoutGroupDetail>(`/buyer/checkout-groups/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/account/checkout-groups" className="text-sm font-bold text-sand-500 hover:text-brand-700">← Checkout Gabungan</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Checkout Gabungan</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900 sm:text-3xl">{group.orders.length} Batch PO</h1>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-800">{STATUS_LABEL[group.status]}</span>
      </div>
      <p className="mt-1 text-sm text-sand-500">Dibuat {formatTanggal(group.createdAt)}</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
        <div className="border-b border-sand-100 bg-sand-50/70 px-5 py-3"><p className="text-xs font-bold uppercase tracking-wide text-sand-500">Rincian per Batch PO</p></div>
        <ul className="divide-y divide-sand-100">
          {group.orders.map((o) => (
            <li key={o.orderId} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <Link href={`/account/orders/${o.orderId}`} className="font-bold text-sand-900 hover:text-brand-700">{o.campaignTitle}</Link>
                <p className="text-xs text-sand-500">{ORDER_STATUS_LABEL[o.status] ?? o.status}</p>
              </div>
              <p className="font-extrabold text-brand-700">{formatRupiah(o.allocatedAmount)}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-sand-100 bg-sand-50/70 px-5 py-3">
          <p className="text-sm font-bold text-sand-700">Total dibayarkan</p>
          <p className="text-lg font-extrabold text-brand-700">{formatRupiah(group.totalAmountTarget)}</p>
        </div>
      </section>

      {group.status === "AWAITING_PAYMENT" && (
        <div className="mt-6"><CheckoutGroupUploadForm checkoutGroupId={group.id} manualTransfers={group.manualTransfers} /></div>
      )}

      {group.status === "PENDING_VERIFICATION" && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
          <p className="font-bold text-brand-800">Bukti transfer sudah diterima.</p>
          <p className="mt-1 text-sm text-brand-700">Menunggu verifikasi dari Seller. Status seluruh Batch PO di atas akan otomatis diperbarui setelah diverifikasi.</p>
          {group.paymentProofFile && <ProofViewerButton url={group.paymentProofFile} className="mt-2 font-bold text-brand-700 hover:underline" />}
        </div>
      )}

      {group.status === "REJECTED" && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="font-bold text-rose-800">Bukti transfer ditolak.</p>
          {group.rejectionReason && <p className="mt-1 text-sm text-rose-700">Alasan: {group.rejectionReason}</p>}
          <div className="mt-3"><CheckoutGroupUploadForm checkoutGroupId={group.id} manualTransfers={group.manualTransfers} /></div>
        </div>
      )}

      {group.status === "PAID" && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
          <p className="font-bold text-brand-800">Checkout gabungan selesai dibayar.</p>
          <p className="mt-1 text-sm text-brand-700">Terverifikasi {group.verifiedAt ? formatTanggal(group.verifiedAt) : ""}. Lihat detail tiap Batch PO untuk status pengiriman.</p>
        </div>
      )}
    </main>
  );
}
