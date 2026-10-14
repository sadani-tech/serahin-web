import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { api, ApiError } from "@/lib/api";
import { OrderBadge } from "@/components/badges";
import type { Billing } from "@/lib/billing";
import { formatRupiah } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL, METODE_PENGIRIMAN_LABEL } from "@/lib/domain";
import type { OrderStatus, PaymentScheme, MetodePengiriman } from "@/lib/types";
import { PublicFooter } from "@/components/PublicFooter";
import { RichText } from "@/components/RichText";
import { IconSprite } from "@/components/revamp/IconSprite";
import { RevampHeader } from "@/components/revamp/RevampHeader";
import { PortalPaymentForm } from "./PortalPaymentForm";
import { PortalSettlementForm } from "./PortalSettlementForm";

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
  settlement: { stage: boolean; unsettledItemIds: string[]; pendingItemIds: string[] };
  campaign: {
    namaProduk: string;
    paymentScheme: PaymentScheme;
    deskripsiPelunasan: string | null;
    linkCheckoutShopee: string | null;
    nominalCheckoutShopee: number | null;
  };
  billing: Billing;
  paymentChannel: "MANUAL_TRANSFER" | "GATEWAY";
  manualTransfer?: {
    bankName: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
  } | null;
  manualTransfers?: {
    id: string;
    accountType: "BANK" | "EWALLET";
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    isPrimary: boolean;
  }[];
  // v2.1 — pembayaran otomatis (payment gateway)
  gatewayEnabled?: boolean;
  pendingGateway?: {
    paymentUrl: string | null;
    vaNumber: string | null;
    qrString: string | null;
    expiresAt: string | null;
  } | null;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pesanan — Serahin",
  robots: { index: false, follow: false },
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const { payment } = await searchParams;

  let order: PortalOrder;
  try {
    order = await api.get<PortalOrder>(`/public/order/${token}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { campaign, billing } = order;
  const totalQty = order.items.reduce((s, it) => s + it.jumlah, 0);
  const shopeePerUnit = campaign.nominalCheckoutShopee ?? 0;
  const shopeeTotal = order.metodePengiriman === "SHOPEE" ? shopeePerUnit * totalQty : 0;

  const dibatalkan = order.status === "DIBATALKAN";
  const ditolak = order.status === "DITOLAK";
  const baruMasuk = order.status === "BARU_MASUK";

  // v2.1 — link pembayaran gateway yang masih hidup (belum lunas/kedaluwarsa).
  // QRIS charges biasanya tidak punya paymentUrl (GDC qrUrl/redirectUrl kosong
  // di praktiknya) — cek ketiga field, jangan cuma paymentUrl, supaya kartu
  // "lanjutkan pembayaran" tidak hilang untuk QRIS.
  const lanjutGateway =
    !dibatalkan &&
    !ditolak &&
    (order.pendingGateway?.paymentUrl ||
      order.pendingGateway?.vaNumber ||
      order.pendingGateway?.qrString)
      ? order.pendingGateway
      : null;
  const qrCodeDataUrl = lanjutGateway?.qrString
    ? await QRCode.toDataURL(lanjutGateway.qrString, { margin: 1, width: 240 }).catch(() => null)
    : null;

  const isPelunasan =
    campaign.paymentScheme === "DP_PELUNASAN" &&
    billing.dpTarget > 0 &&
    billing.dibayar >= billing.dpTarget;
  const paymentDue =
    campaign.paymentScheme === "DP_PELUNASAN" && billing.dpTarget > 0 && !isPelunasan
      ? Math.max(0, billing.dpTarget - billing.dibayar)
      : billing.sisa;

  // Pembeli boleh mengirim pembayaran sendiri bila masih ada tagihan tahap
  // aktif dan tidak ada pembayaran yang sedang menunggu verifikasi. Dipakai
  // untuk tahap DP/full-payment (satu pembayaran per order) — TIDAK dipakai
  // untuk gate kartu pelunasan per-item di bawah (lihat bisaLunasSebagian):
  // field agregat billing.menungguVerifikasi tidak tahu item mana yang
  // pending, jadi kalau dipakai di sana, satu item pending salah
  // memblokir SELURUH item lain yang belum pernah diajukan sama sekali.
  const bisaBayar =
    !dibatalkan &&
    !ditolak &&
    !lanjutGateway &&
    paymentDue > 0 &&
    billing.menungguVerifikasi === 0;

  // Item mana pun yang belum lunas DAN tidak sedang menunggu verifikasi
  // boleh diajukan pelunasannya — tidak diblokir oleh item lain yang
  // kebetulan sedang pending.
  const bisaLunasSebagian =
    !dibatalkan &&
    !ditolak &&
    !lanjutGateway &&
    order.settlement.stage &&
    order.settlement.unsettledItemIds.length > 0;

  return (
    <div className="bg-cream-soft min-h-full">
      <IconSprite />

      {/* Header + hero pakai chrome revamp (sama dengan /po/[token]).
          PortalPaymentForm/PortalSettlementForm di bawah SENGAJA ada di LUAR
          .rv-scope — form itu interaktif (upload bukti, pilih metode kirim,
          preview pelunasan per-item) yang styling-nya Tailwind murni lewat
          komponen @/components/ui (Button/Field/Input — sudah pill/rounded
          konsisten tema revamp). Bila dibungkus .rv-scope, reset
          `.rv-scope button{background:none}` di revamp.css (unlayered,
          selalu menang atas utility Tailwind ber-@layer) akan menghapus bg
          semua tombol polos di form ini — bug yang sama persis dengan yang
          sudah diperbaiki di AuthForm/SellerAuthForm/404. IconSprite di atas
          tetap berlaku untuk <Icon> di luar .rv-scope karena
          <use href="#i-..."> SVG resolve ID di seluruh dokumen, tidak terikat
          ancestor. */}
      <div className="rv-scope js is-loaded">
        <RevampHeader navLinks={[]} loggedIn={false} />
        <section className="po-hero" aria-labelledby="portal-title">
          <div className="po-hero__inner">
            <p className="po-hero__status"><span className="k-hero__dot" aria-hidden="true" />Status Pesanan</p>
            <h1 className="po-hero__title" id="portal-title">{campaign.namaProduk}</h1>
            <p className="po-hero__price">{order.items.length} varian · {totalQty} unit</p>
          </div>
        </section>
      </div>

      <main className="relative mx-auto min-w-0 max-w-2xl space-y-6 px-4 pb-10 pt-7 sm:px-6">
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
        <div className="rounded-2xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="font-head text-base font-semibold text-sand-900">
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
                      className="h-12 w-12 rounded-xl object-cover ring-1 ring-sand-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand-100 text-xs text-sand-400">
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
        <div className="rounded-2xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-100 px-5 py-3">
            <h2 className="font-head text-base font-semibold text-sand-900">
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
              <dd className="mt-1 font-semibold text-brand-700">
                {formatRupiah(billing.dibayar)}
              </dd>
            </div>
            <div className="px-5 py-4 text-center">
              <dt className="text-xs uppercase tracking-wide text-sand-500">
                Sisa
              </dt>
              <dd
                className={`mt-1 font-semibold ${billing.sisa > 0 ? "text-rose-600" : "text-brand-700"}`}
              >
                {billing.sisa > 0 ? formatRupiah(billing.sisa) : "Lunas"}
              </dd>
            </div>
          </dl>
          {shopeeTotal > 0 && (
            <div className="border-t border-orange-100 bg-orange-50 px-5 py-3 text-sm text-orange-950">
              <div className="flex flex-wrap justify-between gap-2"><span>Checkout Shopee ({formatRupiah(shopeePerUnit)} × {totalQty} barang)</span><strong>{formatRupiah(shopeeTotal)}</strong></div>
              <p className="mt-1 text-xs text-orange-800">Nilai ini otomatis mengurangi sisa tagihan pelunasan.</p>
            </div>
          )}
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

        {/* v2.1 — pembayaran gateway masih berjalan: tawarkan lanjutkan */}
        {lanjutGateway && (
          <div className="rounded-2xl border border-brand-200 bg-white shadow-sm">
            <div className="border-b border-sand-100 px-5 py-3">
              <h2 className="font-head text-base font-semibold text-sand-900">
                Selesaikan pembayaran
              </h2>
              <p className="text-xs text-sand-500">
                Anda punya pembayaran otomatis yang belum selesai. Lanjutkan atau
                tunggu konfirmasi.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              {qrCodeDataUrl && (
                <div className="flex flex-col items-center gap-2 rounded-xl bg-sand-50 px-4 py-4 ring-1 ring-inset ring-sand-200">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI, not an optimizable remote asset */}
                  <img
                    src={qrCodeDataUrl}
                    alt="QRIS untuk pembayaran"
                    width={240}
                    height={240}
                    className="h-60 w-60"
                  />
                  <p className="text-xs text-sand-500">
                    Pindai dengan aplikasi e-wallet atau m-banking apa pun yang mendukung QRIS.
                  </p>
                </div>
              )}
              {lanjutGateway.vaNumber && (
                <p className="rounded-xl bg-sand-50 px-4 py-2 text-sm ring-1 ring-inset ring-sand-200">
                  Nomor Virtual Account:{" "}
                  <span className="font-bold text-sand-900">
                    {lanjutGateway.vaNumber}
                  </span>
                </p>
              )}
              {lanjutGateway.paymentUrl && (
                <a
                  href={lanjutGateway.paymentUrl}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand hover:bg-brand-700"
                >
                  Lanjutkan pembayaran
                </a>
              )}
              <p className="text-center text-xs text-sand-400">
                Halaman ini akan otomatis terbarui setelah pembayaran
                terkonfirmasi.
              </p>
            </div>
          </div>
        )}

        {/* Pembayaran mandiri pembeli (pelunasan) */}
        {bisaLunasSebagian && (
          <div className="rounded-2xl border border-sand-200 bg-white shadow-sm">
            <div className="border-b border-sand-100 px-5 py-3">
              <h2 className="font-head text-base font-semibold text-sand-900">
                Lakukan pelunasan
              </h2>
              <p className="text-xs text-sand-500">
                Pilih produk yang mau dilunasi dulu — nominal menyesuaikan produk yang dipilih.
              </p>
            </div>
            <div className="px-5 py-4">
              {campaign.deskripsiPelunasan && (
                <div className="mb-4 min-w-0 overflow-hidden rounded-xl bg-sand-50 p-4 ring-1 ring-inset ring-sand-200">
                  <RichText
                    html={campaign.deskripsiPelunasan}
                    className="break-words"
                  />
                </div>
              )}
              <PortalSettlementForm
                token={token}
                items={order.items}
                unsettledItemIds={order.settlement.unsettledItemIds}
                pendingItemIds={order.settlement.pendingItemIds}
                paymentChannel={order.paymentChannel}
                gatewayAvailable={Boolean(order.gatewayEnabled)}
                manualTransfer={order.manualTransfer}
                manualTransfers={order.manualTransfers}
                shopeeEnabled={Boolean(campaign.linkCheckoutShopee && campaign.nominalCheckoutShopee)}
                linkCheckoutShopee={campaign.linkCheckoutShopee}
              />
            </div>
          </div>
        )}

        {bisaBayar && !order.settlement.stage && (
          <div className="rounded-2xl border border-sand-200 bg-white shadow-sm">
            <div className="border-b border-sand-100 px-5 py-3">
              <h2 className="font-head text-base font-semibold text-sand-900">
                Kirim pembayaran
              </h2>
              <p className="text-xs text-sand-500">
                {campaign.paymentScheme === "DP_PELUNASAN" ? "DP yang perlu dibayar" : "Tagihan"}{" "}
                {formatRupiah(paymentDue)}.
              </p>
            </div>
            <div className="px-5 py-4">
              <PortalPaymentForm
                token={token}
                amountDue={paymentDue}
                isPelunasan={false}
                paymentChannel={order.paymentChannel}
                gatewayAvailable={Boolean(order.gatewayEnabled)}
                manualTransfer={order.manualTransfer}
                manualTransfers={order.manualTransfers}
                linkCheckoutShopee={campaign.linkCheckoutShopee}
                checkoutShopeeAmount={campaign.nominalCheckoutShopee}
                totalQuantity={totalQty}
                resumePayment={payment === "1"}
              />
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
          <p className="text-sm font-semibold text-brand-900">
            Ingin melihat semua pesanan dan profil Anda?
          </p>
          <p className="mt-1 text-xs text-brand-700">
            <Link href="/account" className="font-bold underline hover:text-brand-900">
              Kembali ke Dashboard Buyer
            </Link>{" "}
            untuk mengelola pesanan Anda.
          </p>
        </div>

        <p className="text-center text-xs text-sand-400">
          Halaman ini hanya untuk melihat status. Untuk perubahan, hubungi
          penjual. Jangan bagikan tautan ini ke orang lain.
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}
