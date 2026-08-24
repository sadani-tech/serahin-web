import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { OrderBadge } from "@/components/badges";
import type { Billing } from "@/lib/billing";
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL, METODE_PENGIRIMAN_LABEL } from "@/lib/domain";
import type { OrderStatus, PaymentScheme, MetodePengiriman } from "@/lib/types";
import { PublicFooter } from "@/components/PublicFooter";
import { SerahinLogo } from "@/components/brand";
import { RichText } from "@/components/RichText";
import { PortalPaymentForm } from "./PortalPaymentForm";

type PortalOrder = {
  status: OrderStatus;
  alasanBatal: string | null;
  metodePengiriman: MetodePengiriman | null;
  alamatPengiriman: string | null;
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
    deskripsiPelunasan: string | null;
    linkCheckoutShopee: string | null;
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

  // Pembeli boleh mengirim pembayaran sendiri bila masih ada sisa tagihan dan
  // tidak ada pembayaran yang sedang menunggu verifikasi.
  const bisaBayar =
    !dibatalkan &&
    !ditolak &&
    billing.sisa > 0 &&
    billing.menungguVerifikasi === 0;
  const isPelunasan =
    campaign.paymentScheme === "DP_PELUNASAN" &&
    billing.dpTarget > 0 &&
    billing.dibayar >= billing.dpTarget;

  return (
    <div className="bg-serahin-dots relative min-h-full py-10">
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-72"
      />
      <div className="relative mx-auto min-w-0 max-w-2xl space-y-6 px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <SerahinLogo size="md" layout="stacked" />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700 ring-1 ring-brand-200">
            Status Pesanan
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-sand-900">
            {campaign.namaProduk}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-sand-600">
            {order.items.length} varian · {totalQty} unit
          </p>
        </div>

        {/* Status */}
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white text-center shadow-lg">
          <div aria-hidden="true" className="bg-serahin-ribbon h-1.5 w-full" />
          <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-sand-500">
            Status pesanan Anda
          </p>
          <div className="mt-2 flex justify-center">
            <OrderBadge status={order.status} />
          </div>
          {(dibatalkan || ditolak) && order.alasanBatal && (
            <p className="mt-3 rounded-lg bg-sand-100 px-4 py-2 text-sm text-sand-600">
              {ditolak ? "Pesanan ditolak" : "Pesanan dibatalkan"}. Alasan:{" "}
              {order.alasanBatal}
            </p>
          )}
          {baruMasuk && (
            <p className="mt-3 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
              Pesanan Anda sudah kami terima dan sedang menunggu verifikasi
              Admin. Status akan diperbarui setelah diverifikasi.
            </p>
          )}
          </div>
        </div>

        {/* Rincian item (FR-3.4) */}
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-sand-900">
              Rincian pesanan
            </h2>
          </div>
          <div className="divide-y divide-sand-100">
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
                      className="h-10 w-10 rounded object-cover ring-1 ring-sand-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-sand-100 text-xs text-sand-400">
                      —
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sand-900">
                      {it.variant.namaVarian}
                      {it.warna && (
                        <span className="ml-2 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-medium text-sand-600">
                          {it.warna}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-sand-500">
                      {it.jumlah} × {formatRupiah(it.hargaSaatPesan)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-sand-800">
                  {formatRupiah(Number(it.hargaSaatPesan) * it.jumlah)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan pembayaran */}
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-sand-900">
              Ringkasan pembayaran
            </h2>
            <p className="text-xs text-sand-500">
              Skema: {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]}
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-sand-100">
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-sand-500">
                Total
              </dt>
              <dd className="mt-1 font-semibold text-sand-900">
                {formatRupiah(billing.total)}
              </dd>
            </div>
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-sand-500">
                Terbayar
              </dt>
              <dd className="mt-1 font-semibold text-emerald-600">
                {formatRupiah(billing.dibayar)}
              </dd>
            </div>
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-sand-500">
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
            <p className="border-t border-sand-100 px-5 py-2 text-center text-xs text-amber-700">
              {formatRupiah(billing.menungguVerifikasi)} sedang menunggu
              verifikasi Admin.
            </p>
          )}
          {order.metodePengiriman && (
            <div className="border-t border-sand-100 px-5 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-sand-500">
                Metode pengiriman
              </p>
              <p className="mt-0.5 font-medium text-sand-800">
                {METODE_PENGIRIMAN_LABEL[order.metodePengiriman]}
              </p>
              {order.metodePengiriman === "EKSPEDISI" && order.alamatPengiriman && (
                <p className="mt-0.5 whitespace-pre-wrap text-sand-600">
                  {order.alamatPengiriman}
                </p>
              )}
              {order.metodePengiriman === "SHOPEE" && campaign.linkCheckoutShopee && (
                <a
                  href={campaign.linkCheckoutShopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-medium text-orange-600 underline"
                >
                  Checkout di Shopee →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Pembayaran mandiri pembeli (pelunasan) */}
        {bisaBayar && (
          <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
            <div className="border-b border-sand-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-sand-900">
                {isPelunasan ? "Lakukan pelunasan" : "Kirim pembayaran"}
              </h2>
              <p className="text-xs text-sand-500">
                Sisa tagihan {formatRupiah(billing.sisa)}. Unggah bukti transfer
                untuk diverifikasi Admin.
              </p>
            </div>
            <div className="px-5 py-4">
              {isPelunasan && campaign.deskripsiPelunasan && (
                <div className="mb-4 min-w-0 overflow-hidden rounded-lg bg-sand-50 p-4 ring-1 ring-inset ring-sand-200">
                  <RichText
                    html={campaign.deskripsiPelunasan}
                    className="break-words"
                  />
                </div>
              )}
              <PortalPaymentForm
                token={token}
                sisa={billing.sisa}
                isPelunasan={isPelunasan}
                linkCheckoutShopee={campaign.linkCheckoutShopee}
              />
            </div>
          </div>
        )}

        {/* Timeline kampanye */}
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-sand-900">
              Progres produksi
            </h2>
            <p className="text-xs text-sand-500">
              Estimasi kirim: {formatTanggal(campaign.estimasiKirim)}
            </p>
          </div>
          {campaign.timelineEntries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-sand-500">
              Belum ada update progres.
            </p>
          ) : (
            <ol className="space-y-4 px-6 py-5">
              {campaign.timelineEntries.map((e) => (
                <li key={e.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                  <p className="font-medium text-sand-900">{e.judulUpdate}</p>
                  {e.catatan && (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-sand-600">
                      {e.catatan}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-sand-400">
                    {formatWaktu(e.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="text-center text-xs text-sand-400">
          Halaman ini hanya untuk melihat status. Untuk perubahan, hubungi
          penjual. Jangan bagikan tautan ini ke orang lain.
        </p>

        <PublicFooter />
      </div>
    </div>
  );
}
