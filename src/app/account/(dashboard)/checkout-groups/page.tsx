import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

type CheckoutGroup = {
  id: string;
  status: "AWAITING_PAYMENT" | "PENDING_VERIFICATION" | "PAID" | "REJECTED" | "CANCELLED";
  totalAmountTarget: number;
  createdAt: string;
  orders: { orderId: string; campaignTitle: string; status: string; allocatedAmount: number }[];
};

const STATUS: Record<CheckoutGroup["status"], { label: string; className: string }> = {
  AWAITING_PAYMENT: { label: "Belum bayar", className: "bg-sun-100 text-sun-800" },
  PENDING_VERIFICATION: { label: "Menunggu verifikasi", className: "bg-brand-100 text-brand-800" },
  PAID: { label: "Lunas", className: "bg-brand-50 text-brand-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-sand-100 text-sand-700" },
};

export default async function CheckoutGroupsPage() {
  const groups = await api.get<CheckoutGroup[]>("/buyer/checkout-groups");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Riwayat</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-900 sm:text-3xl">Checkout Gabungan</h1>
        <p className="mt-1 text-sm text-sand-500">Pembayaran yang menggabungkan beberapa Batch PO dari Seller yang sama dalam satu transfer.</p>
      </div>

      {groups.length ? (
        <div className="mt-6 space-y-3">
          {groups.map((group) => {
            const status = STATUS[group.status];
            return (
              <Link key={group.id} href={`/account/checkout-groups/${group.id}`} className="block overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center justify-between gap-3 border-b border-sand-100 bg-sand-50/70 px-4 py-3 sm:px-5">
                  <p className="text-xs font-bold text-sand-500">{group.orders.length} Batch PO</p>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold ${status.className}`}>{status.label}</span>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-sm text-sand-700">{group.orders.map((o) => o.campaignTitle).join(", ")}</p>
                  <p className="mt-2 text-xl font-extrabold text-brand-700">{formatRupiah(group.totalAmountTarget)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-sand-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-extrabold text-sand-900">Belum ada checkout gabungan</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-sand-500">Saat kamu checkout 2 Batch PO atau lebih dari Seller yang sama sekaligus, riwayatnya akan muncul di sini.</p>
        </div>
      )}
    </main>
  );
}
