import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { OrderBadge } from "@/components/badges";
import type { Billing } from "@/lib/billing";
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import type { OrderStatus, PaymentScheme } from "@/lib/types";
import { PublicFooter } from "@/components/PublicFooter";

type PortalOrder = {
  status: OrderStatus;
  alasanBatal: string | null;
  items: {
    id: string;
    jumlah: number;
    hargaSaatPesan: string;
    warna: string | null;
    variant: { namaVarian: string; gambarUrl: string | null };
  }[];
  campaign: {
    namaProduk: string;
    paymentScheme: PaymentScheme;
    estimasiKirim: string | null;
    timelineEntries: {
      id: string;
      judulUpdate: string;
      catatan: string | null;
      createdAt: string;
    }[];
  };
  billing: Billing;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pesanan — Serahin",
  robots: { index: false, follow: false },
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let order: PortalOrder;
  try {
    order = await api.get<PortalOrder>(`/public/order/${token}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { campaign, billing } = order;
  const totalQty = order.items.reduce((s, it) => s + it.jumlah, 0);

  const dibatalkan = order.status === "DIBATALKAN";
  const ditolak = order.status === "DITOLAK";
  const baruMasuk = order.status === "BARU_MASUK";

  return (
    <div className="min-h-full bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Serahin · Status Pesanan
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {campaign.namaProduk}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.items.length} varian · {totalQty} unit
          </p>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status pesanan Anda
          </p>
          <div className="mt-2 flex justify-center">
            <OrderBadge status={order.status} />
          </div>
          {(dibatalkan || ditolak) && order.alasanBatal && (
            <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {ditolak ? "Pesanan ditolak" : "Pesanan dibatalkan"}. Alasan:{" "}
              {order.alasanBatal}
            </p>
          )}
          {baruMasuk && (
            <p className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-700">
              Pesanan Anda sudah kami terima dan sedang menunggu verifikasi
              Admin. Status akan diperbarui setelah diverifikasi.
            </p>
          )}
        </div>

        {/* Rincian item (FR-3.4) */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Rincian pesanan
            </h2>
          </div>
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
                      {it.warna && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {it.warna}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {it.jumlah} × {formatRupiah(it.hargaSaatPesan)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-800">
                  {formatRupiah(Number(it.hargaSaatPesan) * it.jumlah)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan pembayaran */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Ringkasan pembayaran
            </h2>
            <p className="text-xs text-slate-500">
              Skema: {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]}
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-slate-100">
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Total
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatRupiah(billing.total)}
              </dd>
            </div>
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Terbayar
              </dt>
              <dd className="mt-1 font-semibold text-emerald-600">
                {formatRupiah(billing.dibayar)}
              </dd>
            </div>
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Sisa
              </dt>
              <dd
                className={`mt-1 font-semibold ${billing.sisa > 0 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {billing.sisa > 0 ? formatRupiah(billing.sisa) : "Lunas"}
              </dd>
            </div>
          </dl>
          {billing.menungguVerifikasi > 0 && (
            <p className="border-t border-slate-100 px-5 py-2 text-center text-xs text-amber-700">
              {formatRupiah(billing.menungguVerifikasi)} sedang menunggu
              verifikasi Admin.
            </p>
          )}
        </div>

        {/* Timeline kampanye */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Progres produksi
            </h2>
            <p className="text-xs text-slate-500">
              Estimasi kirim: {formatTanggal(campaign.estimasiKirim)}
            </p>
          </div>
          {campaign.timelineEntries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Belum ada update progres.
            </p>
          ) : (
            <ol className="space-y-4 px-6 py-5">
              {campaign.timelineEntries.map((e) => (
                <li key={e.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                  <p className="font-medium text-slate-900">{e.judulUpdate}</p>
                  {e.catatan && (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">
                      {e.catatan}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatWaktu(e.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Halaman ini hanya untuk melihat status. Untuk perubahan, hubungi
          penjual. Jangan bagikan tautan ini ke orang lain.
        </p>

        <PublicFooter />
      </div>
    </div>
  );
}
