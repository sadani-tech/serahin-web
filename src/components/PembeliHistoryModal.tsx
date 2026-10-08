"use client";

import { useEffect, useRef, useState } from "react";
import { OrderBadge } from "@/components/badges";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

type HistoryOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  campaign: { id: string; namaProduk: string };
  items: { id: string; nama: string; jumlah: number; hargaSaatPesan: number }[];
  total: number;
};

type HistoryDetail = {
  id: string;
  name: string;
  kontak: string;
  isActive: boolean;
  createdAt: string;
  summary: { orderCount: number; totalPurchase: number };
  orders: HistoryOrder[];
};

export function PembeliHistoryModal({ buyerId, onClose }: { buyerId: string; onClose: () => void }) {
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: HistoryDetail | null }>({
    loading: true,
    error: null,
    data: null,
  });
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pembeli/${buyerId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message ?? "Gagal memuat riwayat pembeli.");
        return body as HistoryDetail;
      })
      .then((data) => { if (!cancelled) setState({ loading: false, error: null, data }); })
      .catch((error: Error) => { if (!cancelled) setState({ loading: false, error: error.message, data: null }); });
    return () => { cancelled = true; };
  }, [buyerId]);

  useEffect(() => {
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-sand-950/25 px-4 py-8 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="pembeli-history-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Tutup riwayat pembeli" onClick={onClose} />
      <section className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl">
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sand-500 shadow-sm ring-1 ring-sand-200 hover:text-sand-900">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
        </button>

        {state.loading && <div className="p-10 text-center text-sm text-sand-500">Memuat riwayat pembelian…</div>}
        {state.error && <div className="p-10 text-center text-sm text-rose-600">{state.error}</div>}

        {state.data && (
          <div className="flex max-h-[85vh] flex-col">
            <header className="border-b border-sand-100 bg-cream-soft px-6 py-5">
              <h2 id="pembeli-history-title" className="text-lg font-extrabold text-sand-900">{state.data.name}</h2>
              <p className="mt-1 text-sm text-sand-600">{state.data.kontak}</p>
              <p className="mt-2 text-xs text-sand-500">
                {state.data.summary.orderCount} pesanan · total {formatRupiah(state.data.summary.totalPurchase)}
              </p>
            </header>
            <div className="overflow-y-auto px-6 py-4">
              {state.data.orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-sand-500">Belum ada pesanan dari Buyer ini.</p>
              ) : (
                <ul className="divide-y divide-sand-100">
                  {state.data.orders.map((order) => (
                    <li key={order.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-sand-900">{order.campaign.namaProduk}</p>
                        <OrderBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-sand-500">
                        {formatTanggal(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.jumlah, 0)} item
                      </p>
                      <p className="mt-1 text-sm font-bold text-sand-700">{formatRupiah(order.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
