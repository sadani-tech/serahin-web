import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderBadge, PaymentBadge } from "@/components/badges";
import { Card, CardHeader, EmptyState, LinkButton } from "@/components/ui";
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
} from "@/lib/domain";
import { computeBilling } from "@/lib/billing";
import { OrderStatusControl } from "./OrderStatusControl";
import { CancelOrderForm } from "./CancelOrderForm";
import { PaymentForm } from "./PaymentForm";
import { PaymentActions } from "./PaymentActions";
import { CopyPortalLink } from "./CopyPortalLink";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      campaign: true,
      items: { include: { variant: { select: { namaVarian: true, gambarUrl: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      statusLogs: {
        orderBy: { createdAt: "desc" },
        include: { dibuatOleh: { select: { name: true } } },
      },
    },
  });
  if (!order) notFound();

  const billing = computeBilling({
    items: order.items,
    paymentScheme: order.campaign.paymentScheme,
    dpPercent: order.campaign.dpPercent,
    payments: order.payments,
  });
  const totalQty = order.items.reduce((s, it) => s + it.jumlah, 0);

  const dibatalkan = order.status === "DIBATALKAN";
  const deadline = order.campaign.deadlinePelunasan;
  const deadlineDekat =
    deadline &&
    !billing.lunas &&
    !dibatalkan &&
    deadline.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  const deadlineLewat =
    deadline && !billing.lunas && !dibatalkan && deadline.getTime() < Date.now();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/kampanye/${order.campaignId}?tab=pesanan`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← {order.campaign.namaProduk}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {order.namaPembeli || "(Nama belum diisi)"}
              </h1>
              <OrderBadge status={order.status} />
              {(!order.namaPembeli || !order.kontak) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Data belum lengkap
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {order.kontak || "kontak kosong"} · {order.items.length} varian ·{" "}
              {totalQty} unit
            </p>
          </div>
          {!dibatalkan && (
            <LinkButton href={`/pesanan/${id}/edit`} variant="secondary">
              Edit pesanan
            </LinkButton>
          )}
        </div>
      </div>

      {dibatalkan && order.alasanBatal && (
        <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <b>Pesanan dibatalkan.</b> Alasan: {order.alasanBatal}
        </div>
      )}

      {(deadlineLewat || deadlineDekat) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            deadlineLewat
              ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
              : "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
          }`}
        >
          {deadlineLewat ? "⚠ Deadline pelunasan terlewat" : "⏰ Mendekati deadline pelunasan"}
          {" — "}
          {formatTanggal(deadline)} · sisa {formatRupiah(billing.sisa)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kiri: billing + pembayaran */}
        <div className="space-y-6 lg:col-span-2">
          {/* Billing */}
          <Card>
            <CardHeader title="Ringkasan tagihan" />
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatRupiah(billing.total)}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Terbayar
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">
                  {formatRupiah(billing.dibayar)}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Sisa tagihan
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${billing.sisa > 0 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {formatRupiah(billing.sisa)}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {order.campaign.paymentScheme === "DP_PELUNASAN"
                    ? `Target DP (${order.campaign.dpPercent ?? 50}%)`
                    : "Menunggu verifikasi"}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-700">
                  {order.campaign.paymentScheme === "DP_PELUNASAN"
                    ? formatRupiah(billing.dpTarget)
                    : formatRupiah(billing.menungguVerifikasi)}
                </p>
              </div>
            </div>
          </Card>

          {/* Item pesanan (keranjang) — v1.5 */}
          <Card>
            <CardHeader title={`Item pesanan (${order.items.length})`} />
            <div className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    {it.variant.gambarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.variant.gambarUrl}
                        alt={it.variant.namaVarian}
                        className="h-10 w-10 rounded object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                        —
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">
                        {it.variant.namaVarian}
                      </p>
                      <p className="text-xs text-slate-500">
                        {it.jumlah} × {formatRupiah(it.hargaSaatPesan)}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-slate-800">
                    {formatRupiah(Number(it.hargaSaatPesan) * it.jumlah)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Daftar pembayaran */}
          <Card>
            <CardHeader
              title="Pembayaran"
              subtitle="Hanya pembayaran terverifikasi yang mengurangi sisa tagihan."
            />
            {order.payments.length === 0 ? (
              <EmptyState title="Belum ada pembayaran tercatat" />
            ) : (
              <div className="divide-y divide-slate-100">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatRupiah(p.jumlah)}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          {PAYMENT_TYPE_LABEL[p.jenis]}
                        </span>
                        <PaymentBadge status={p.statusVerifikasi} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTanggal(p.tanggal)}
                        {p.buktiFile && (
                          <>
                            {" · "}
                            <a
                              href={p.buktiFile}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-700 underline"
                            >
                              Lihat bukti
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <PaymentActions
                      paymentId={p.id}
                      status={p.statusVerifikasi}
                    />
                  </div>
                ))}
              </div>
            )}

            {!dibatalkan && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">
                  Catat pembayaran baru
                </h4>
                <PaymentForm
                  orderId={id}
                  scheme={order.campaign.paymentScheme}
                  sisaDp={Math.max(billing.dpTarget - billing.dibayar, 0)}
                  sisaTotal={billing.sisa}
                />
              </div>
            )}
          </Card>

          {/* Riwayat status pesanan (FR-4.5) */}
          <Card>
            <CardHeader title="Riwayat status pesanan" />
            {order.statusLogs.length === 0 ? (
              <EmptyState title="Belum ada riwayat" />
            ) : (
              <ol className="space-y-4 px-6 py-5">
                {order.statusLogs.map((log) => (
                  <li key={log.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                    <p className="text-sm text-slate-800">
                      {log.statusLama
                        ? `${ORDER_STATUS_LABEL[log.statusLama]} → `
                        : ""}
                      <span className="font-medium">
                        {ORDER_STATUS_LABEL[log.statusBaru]}
                      </span>
                    </p>
                    {log.catatan && (
                      <p className="mt-0.5 text-sm text-slate-600">
                        {log.catatan}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatWaktu(log.createdAt)}
                      {log.dibuatOleh?.name ? ` · ${log.dibuatOleh.name}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Kanan: kontrol status + batalkan */}
        <div className="space-y-6">
          <Card className="p-5">
            <CopyPortalLink token={order.tokenAkses} />
          </Card>
          {!dibatalkan && (
            <>
              <Card className="p-5">
                <OrderStatusControl orderId={id} current={order.status} />
              </Card>
              <Card className="p-5">
                <CancelOrderForm orderId={id} />
              </Card>
            </>
          )}
          {order.catatan && (
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Catatan pesanan
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {order.catatan}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
