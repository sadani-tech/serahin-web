"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import { OrderBadge } from "@/components/badges";
import { formatRupiah } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/domain";
import { useConfirm } from "@/components/ConfirmDialog";
import { useNavLoading } from "@/hooks/useNavLoading";
import { bulkUpdateOrderStatus } from "@/app/(app)/pesanan/actions";
import type { OrderStatus } from "@/lib/types";

export type OrderRow = {
  id: string;
  namaPembeli: string;
  kontak: string;
  varianLabel: string;
  totalQty: number;
  status: OrderStatus;
  sisa: number;
  aktif: boolean;
};

export function OrderBulkTable({
  campaignId,
  rows,
}: {
  campaignId: string;
  rows: OrderRow[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const { confirm, alert } = useConfirm();
  const { startLoading, stopLoading } = useNavLoading();
  const router = useRouter();
  const headRef = useRef<HTMLInputElement>(null);

  // Simpan & pulihkan posisi scroll daftar agar saat kembali dari detail
  // pesanan (browser back atau tautan "←") tetap di baris yang dipilih —
  // scroll internal container tidak dipulihkan otomatis oleh browser.
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = `orderlist-scroll:${campaignId}`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) el.scrollTop = Number(saved) || 0;
    const onScroll = () =>
      sessionStorage.setItem(storageKey, String(el.scrollTop));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [storageKey]);

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && !allChecked;
  if (headRef.current) headRef.current.indeterminate = someChecked;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((s) =>
      s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );

  async function apply() {
    if (!target || selected.size === 0) return;
    const label = ORDER_STATUS_LABEL[target as OrderStatus];
    const ok = await confirm({
      title: `Ubah status ${selected.size} pesanan?`,
      description: `Status akan diubah menjadi "${label}". Pesanan yang dibatalkan/ditolak akan dilewati.`,
      confirmLabel: "Ubah status",
      variant: "primary",
    });
    if (!ok) return;

    setBusy(true);
    startLoading();
    let res: { updated?: number; error?: string };
    try {
      res = await bulkUpdateOrderStatus(campaignId, Array.from(selected), target);
    } finally {
      stopLoading();
      setBusy(false);
    }

    if (res.error) {
      await alert({ title: "Gagal", description: res.error });
      return;
    }
    setSelected(new Set());
    setTarget("");
    router.refresh();
    await alert({
      title: "Status diperbarui",
      description: `${res.updated ?? 0} pesanan diubah menjadi "${label}".`,
    });
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-sand-100 bg-sand-50 px-5 py-3">
          <span className="text-sm font-medium text-sand-700">
            {selected.size} dipilih
          </span>
          <Select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-9 w-auto"
          >
            <option value="">Pilih status baru…</option>
            {ORDER_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            onClick={apply}
            disabled={!target || busy}
            className="h-9"
          >
            {busy ? "Memproses…" : "Terapkan"}
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-sand-500 hover:text-sand-700"
          >
            Batal
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto overscroll-contain"
        style={{ maxHeight: "35rem" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
              <th className="px-5 py-3">
                <input
                  ref={headRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-sand-300"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-5 py-3 font-medium">Pembeli</th>
              <th className="px-5 py-3 font-medium">Varian</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Sisa tagihan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {rows.map((o) => {
              const checked = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  className={checked ? "bg-sand-50" : "hover:bg-sand-50"}
                >
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.id)}
                      className="h-4 w-4 rounded border-sand-300"
                      aria-label={`Pilih ${o.namaPembeli}`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/pesanan/${o.id}`}
                      className="font-medium text-sand-900 hover:underline"
                    >
                      {o.namaPembeli}
                    </Link>
                    <div className="text-xs text-sand-500">{o.kontak}</div>
                  </td>
                  <td className="px-5 py-3 text-sand-700">{o.varianLabel}</td>
                  <td className="px-5 py-3 text-sand-700">{o.totalQty}</td>
                  <td className="px-5 py-3">
                    <OrderBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3">
                    {!o.aktif ? (
                      <span className="text-sand-400">-</span>
                    ) : o.sisa > 0 ? (
                      <span className="font-medium text-rose-600">
                        {formatRupiah(o.sisa)}
                      </span>
                    ) : (
                      <span className="text-emerald-600">Lunas</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
