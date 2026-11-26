"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { loadBuyerOrders } from "./orders-actions";
import type { Dashboard } from "./page";

type Order = Dashboard["orders"][number];
const actions: Record<string, string> = { PAY_DOWN_PAYMENT: "Bayar DP", WAIT_VERIFICATION: "Menunggu verifikasi", REUPLOAD_PAYMENT: "Unggah ulang bukti", PAY_SETTLEMENT: "Bayar pelunasan", COMPLETE_SHIPPING: "Lengkapi pengiriman", TRACK_SHIPMENT: "Lacak pesanan", NONE: "Lihat detail" };
const progressLabels: Record<string, string> = { OPEN: "Open", CLOSED: "Closed", PRODUCTION: "Produksi", SHIPMENT: "Pengiriman", PACKING: "Siap kirim", DELIVERED: "Terkirim", COMPLETED: "Selesai", SUPPLIER_PROCESSING: "Diproses supplier", INTERNATIONAL_TRANSIT: "Transit internasional", ARRIVED_INDONESIA: "Tiba di Indonesia", QUALITY_CHECK: "Pemeriksaan kualitas", READY_TO_SHIP: "Siap dikirim", SHIPPED: "Dikirim", CANCELLED: "Dibatalkan", REJECTED: "Ditolak" };

export function MoreBuyerOrders({ status, initialPage, totalPages, initialCount, total }: { status: string; initialPage: number; totalPages: number; initialCount: number; total: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(initialPage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const load = useCallback(async () => {
    if (busyRef.current || page >= totalPages) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const next = await loadBuyerOrders(page + 1, status);
      setOrders((current) => [...current, ...next.orders]);
      setPage(next.pagination.page);
    } catch { setError("Pesanan berikutnya belum berhasil dimuat. Coba lagi."); }
    finally { busyRef.current = false; setBusy(false); }
  }, [page, status, totalPages]);
  useEffect(() => {
    if (error || page >= totalPages || !trigger.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void load(); }, { rootMargin: "200px" });
    observer.observe(trigger.current);
    return () => observer.disconnect();
  }, [error, page, totalPages, load]);
  return <div className="mt-4 space-y-4" aria-live="polite">
    {orders.map((order) => <OrderCard key={order.id} order={order}/>)}
    {page < totalPages && <div ref={trigger} className="flex flex-col items-center gap-2 py-4"><p className="text-xs text-sand-500">Menampilkan {initialCount + orders.length} dari {total} pesanan</p><button type="button" disabled={busy} onClick={() => void load()} className="min-h-11 rounded-xl border border-brand-300 bg-white px-6 text-sm font-bold text-brand-700 disabled:opacity-60">{busy ? "Memuat pesanan..." : "Muat pesanan berikutnya"}</button>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</div>}
    {page >= totalPages && total > initialCount && <p className="py-4 text-center text-xs text-sand-500">Semua {total} pesanan sudah ditampilkan.</p>}
  </div>;
}

export function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const thumb = order.items[0]?.salesEventItem?.displayImages[0] ?? order.items[0]?.salesEventItem?.productVariant.images[0] ?? null;
  return <article className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-100 bg-sand-50 px-4 py-3 text-xs"><span className="font-bold text-sand-500">Dipesan {formatTanggal(order.createdAt)}</span><div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-sun-100 px-2.5 py-1 font-bold text-sun-900">{order.paymentStatus === "PAID" ? "Lunas" : order.paymentStatus === "DOWN_PAYMENT" ? "DP diterima" : "Belum bayar"}</span><span className="rounded-full bg-brand-100 px-2.5 py-1 font-bold text-brand-800">{progressLabels[order.orderProgressStatus] ?? order.orderProgressStatus}</span></div></div>
    <div className="flex gap-3 p-4 sm:p-5">{thumb ? <Image unoptimized src={thumb} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl object-cover"/> : <div className="h-16 w-16 shrink-0 rounded-xl bg-sand-100"/>}<div className="min-w-0 flex-1"><Link href={`/account/orders/${order.id}`} className="block font-extrabold text-sand-900">{order.salesEvent.title}</Link><p className="mt-1 text-sm text-sand-500">{itemCount} item{order.items[0]?.variantNameSnapshot ? ` · ${order.items[0].variantNameSnapshot}` : ""}</p>{order.rejectionReason && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-800">Pembayaran ditolak: {order.rejectionReason}</p>}<div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-sand-100 pt-3"><div><p className="text-xs text-sand-500">Total pesanan</p><p className="text-lg font-extrabold text-brand-700">{formatRupiah(order.billing.total)}</p>{order.billing.remaining > 0 && <p className="text-xs text-sun-800">Sisa {formatRupiah(order.billing.remaining)}</p>}</div><Link href={`/account/orders/${order.id}`} className="inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white">{actions[order.nextAction] ?? "Lihat detail"}</Link></div></div></div>
  </article>;
}
