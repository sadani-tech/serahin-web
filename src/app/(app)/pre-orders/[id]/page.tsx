import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CampaignBadge } from "@/components/badges";
import { RichText } from "@/components/RichText";
import {
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  ScrollList,
} from "@/components/ui";
import {
  formatRupiah,
  formatTanggal,
  formatWaktu,
} from "@/lib/format";
import {
  CAMPAIGN_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_SCHEME_LABEL,
} from "@/lib/domain";
import {
  computeVendorStats,
  ratingStars,
  KETEPATAN_LABEL,
  KUALITAS_LABEL,
} from "@/lib/vendor";
import type {
  OrderStatus,
  CampaignStatus,
  PaymentScheme,
  DpTipe,
  KetepatanWaktu,
  KesesuaianKualitas,
} from "@/lib/types";
import type { EvalInput } from "@/lib/vendor";
import { StatusControl } from "./StatusControl";
import { DuplicatePreorderButton } from "./DuplicatePreorderButton";
import { TimelineForm } from "./TimelineForm";
import { FormPublikControl } from "./FormPublikControl";
import { EvaluationForm } from "./EvaluationForm";
import { OrderBulkTable, type OrderRow } from "@/components/OrderBulkTable";
import { DestructiveActionForm } from "@/components/DestructiveActionForm";
import { getSession } from "@/lib/session";
import { removeInvalidOrder } from "../../management-actions";

export const dynamic = "force-dynamic";

type Tab = "info" | "pesanan" | "timeline";

const MILESTONE_LABEL: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  PRODUCTION: "Produksi",
  SHIPMENT: "Shipment",
  PACKING: "Packing",
  DELIVERED: "Deliver",
  COMPLETED: "Selesai",
};

type CampaignDetail = {
  namaProduk: string;
  status: CampaignStatus;
  harga: string;
  paymentScheme: PaymentScheme;
  dpTipe: DpTipe | null;
  dpPercent: number | null;
  dpNominal: string | null;
  tanggalBuka: string;
  tanggalTutup: string;
  estimasiProduksi: string | null;
  estimasiKirim: string | null;
  deadlinePelunasan: string | null;
  deskripsi: string | null;
  formToken: string;
  formAktif: boolean;
  orderCount: number;
  variants: {
    id: string;
    namaVarian: string;
    kuotaMaks: number;
    harga: string;
    hargaPerluTinjau: boolean;
    terisi: number;
    sisa: number;
    vendor: { id: string; nama: string } | null;
  }[];
  timelineEntries: {
    id: string;
    judulUpdate: string;
    catatan: string | null;
    otomatis: boolean;
    createdAt: string;
    dibuatOleh: { name: string } | null;
    milestoneCode: string | null;
  }[];
  orders: never[];
  vendors: { id: string; nama: string; evaluations: EvalInput[] }[];
  evaluations: {
    vendorId: string;
    ketepatanWaktu: KetepatanWaktu;
    jumlahHariTelat: number | null;
    kesesuaianKualitas: KesesuaianKualitas;
    rating: number;
    catatan: string | null;
  }[];
};

type CampaignOrderEnvelope = {
  data: Array<{
    id: string;
    namaPembeli: string;
    kontak: string;
    status: OrderStatus;
    createdAt: string;
    items: Array<{ variantId: string; namaVarian: string; jumlah: number }>;
    billing: { total: number; dibayar: number; menunggu: number; sisa: number };
    paymentStatus: string;
    shipment: { method: "SHOPEE" | "COURIER"; label: string; courier: string | null; trackingNumber: string | null } | null;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
  filters: { variants: Array<{ id: string; name: string }>; shippingMethods: string[] };
};

const ORDER_FILTERS = [
  ["SUBMITTED", "Baru Masuk"],
  ["AWAITING_DOWN_PAYMENT", "Menunggu DP"],
  ["DOWN_PAYMENT_RECEIVED", "DP Diterima"],
  ["PAID", "Lunas"],
  ["IN_PRODUCTION", "Produksi"],
  ["READY_TO_SHIP", "Siap Kirim"],
  ["SHIPPED", "Dikirim"],
  ["COMPLETED", "Selesai"],
  ["CANCELLED", "Dibatalkan"],
  ["REJECTED", "Ditolak"],
] as const;

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; q?: string; status?: string; payment?: string; variant?: string; shipping?: string; page?: string; limit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const tab: Tab = (["info", "pesanan", "timeline"].includes(sp.tab ?? "")
    ? sp.tab
    : "info") as Tab;

  let campaign: CampaignDetail;
  try {
    campaign = await api.get<CampaignDetail>(`/pre-orders/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  // Kuota terisi per varian (item pesanan aktif) — v1.5.
  const kuotaTotal = campaign.variants.reduce((s, v) => s + v.kuotaMaks, 0);
  const kuotaTerisi = campaign.variants.reduce((s, v) => s + (v.terisi ?? 0), 0);
  const requestedPage = Math.max(1, Number(sp.page) || 1);
  const requestedLimit = [10, 25, 50, 100].includes(Number(sp.limit)) ? Number(sp.limit) : 25;
  const ordersEnvelope = tab === "pesanan"
    ? await api.get<CampaignOrderEnvelope>(`/pre-orders/${id}/orders`, {
        page: requestedPage,
        limit: requestedLimit,
        search: sp.q,
        orderStatus: sp.status,
        paymentStatus: sp.payment,
        variantId: sp.variant,
        shippingMethod: sp.shipping,
      })
    : null;
  const orders = ordersEnvelope?.data ?? [];

  // Baris pesanan siap-render untuk tabel bulk (billing dihitung di server).
  const orderRows: OrderRow[] = orders.map((o) => ({
      id: o.id,
      namaPembeli: o.namaPembeli,
      kontak: o.kontak,
      varianLabel:
        o.items.length === 1
          ? o.items[0].namaVarian
          : `${o.items.length} varian`,
      totalQty: o.items.reduce((s, it) => s + it.jumlah, 0),
      status: o.status,
      sisa: o.billing.sisa,
      aktif: !["DIBATALKAN", "DITOLAK"].includes(o.status),
      paymentStatus: o.paymentStatus,
      shipment: o.shipment,
      createdAt: o.createdAt,
    }));

  const deadlineLewat =
    !!campaign.deadlinePelunasan &&
    // eslint-disable-next-line react-hooks/purity -- server render needs a request-time deadline comparison
    new Date(campaign.deadlinePelunasan).getTime() < Date.now();

  const tabHref = (t: Tab) => `/pre-orders/${id}?tab=${t}`;
  const ordersHref = (page: number) => {
    const query = new URLSearchParams({ tab: "pesanan" });
    if (sp.q) query.set("q", sp.q);
    if (sp.status) query.set("status", sp.status);
    if (sp.payment) query.set("payment", sp.payment);
    if (sp.variant) query.set("variant", sp.variant);
    if (sp.shipping) query.set("shipping", sp.shipping);
    if (requestedLimit !== 25) query.set("limit", String(requestedLimit));
    if (page > 1) query.set("page", String(page));
    return `/pre-orders/${id}?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/pre-orders"
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Daftar Batch PO
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-sand-900">
                {campaign.namaProduk}
              </h1>
              <CampaignBadge status={campaign.status} />
            </div>
            <p className="mt-1 text-sm text-sand-500">
              {formatRupiah(campaign.harga)} / unit ·{" "}
              {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]}
              {dpLabel(campaign) ? ` (${dpLabel(campaign)})` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton
              href={`/pre-orders/${id}/edit`}
              variant="secondary"
            >
              Edit
            </LinkButton>
            <DuplicatePreorderButton campaignId={id} />
            <LinkButton
              href={`/import/pre-orders/${id}`}
              variant="secondary"
            >
              Impor Pesanan
            </LinkButton>
            <LinkButton href={`/pre-orders/${id}/pesanan/baru`}>
              + Tambah Pesanan
            </LinkButton>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sand-200">
        {(
          [
            ["info", "Info & Status"],
            ["pesanan", `Pesanan (${campaign.orderCount})`],
            ["timeline", `Timeline (${campaign.timelineEntries.length})`],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-brand-500 text-sand-900"
                : "border-transparent text-sand-500 hover:text-sand-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Detail Batch PO" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 py-4 text-sm">
                <Info label="Harga / unit" value={formatRupiah(campaign.harga)} />
                <Info label="Skema pembayaran"
                  value={
                    PAYMENT_SCHEME_LABEL[campaign.paymentScheme] +
                    (dpLabel(campaign) ? ` — ${dpLabel(campaign)}` : "")
                  }
                />
                <Info label="Tanggal buka" value={formatTanggal(campaign.tanggalBuka)} />
                <Info label="Tanggal tutup" value={formatTanggal(campaign.tanggalTutup)} />
                <Info label="Estimasi produksi" value={formatTanggal(campaign.estimasiProduksi)} />
                <Info label="Estimasi kirim" value={formatTanggal(campaign.estimasiKirim)} />
                <Info
                  label="Deadline pelunasan"
                  value={
                    <span className={deadlineLewat ? "font-medium text-rose-600" : ""}>
                      {formatTanggal(campaign.deadlinePelunasan)}
                      {deadlineLewat && " (terlewat)"}
                    </span>
                  }
                />
                <div className="col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-sand-500">
                    Deskripsi
                  </dt>
                  <dd className="mt-1 text-sand-700">
                    {campaign.deskripsi ? (
                      <RichText html={campaign.deskripsi} />
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader
                title="Varian & kuota"
                subtitle={`Total terisi ${kuotaTerisi} dari ${kuotaTotal} kuota`}
              />
              <ScrollList className="divide-y divide-sand-100" maxRows={15}>
                {campaign.variants.map((v) => {
                  const terisi = v.terisi ?? 0;
                  const persen = v.kuotaMaks
                    ? Math.min(100, Math.round((terisi / v.kuotaMaks) * 100))
                    : 0;
                  const penuh = terisi >= v.kuotaMaks;
                  return (
                    <div key={v.id} className="px-5 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-sand-800">
                          {v.namaVarian}
                          <span className="ml-2 font-normal text-sand-500">
                            {formatRupiah(v.harga)}
                          </span>
                          {v.hargaPerluTinjau && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                              harga migrasi
                            </span>
                          )}
                        </span>
                        <span className={penuh ? "text-rose-600" : "text-sand-600"}>
                          {terisi} / {v.kuotaMaks}
                          {penuh && " · penuh"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
                        <div
                          className={`h-full rounded-full ${penuh ? "bg-rose-500" : "bg-brand-600"}`}
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </ScrollList>
            </Card>
          </div>

          <div>
            <Card className="p-5">
              <StatusControl campaignId={id} current={campaign.status} />
              <div className="mt-4 border-t border-sand-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
                  Alur status
                </p>
                <p className="mt-1 text-sm text-sand-600">
                  {CAMPAIGN_STATUS_LABEL.OPEN} → {CAMPAIGN_STATUS_LABEL.CLOSED} →{" "}
                  {CAMPAIGN_STATUS_LABEL.PRODUKSI} →{" "}
                  {CAMPAIGN_STATUS_LABEL.SIAP_KIRIM} →{" "}
                  {CAMPAIGN_STATUS_LABEL.SELESAI}
                </p>
              </div>
            </Card>

            {/* Formulir PO publik (v1.2 FR-1.1 / FR-1.7) */}
            <Card className="mt-6 p-5">
              <FormPublikControl
                campaignId={id}
                formToken={campaign.formToken}
                aktif={campaign.formAktif}
                bisaAktif={campaign.status === "OPEN"}
              />
            </Card>

            {/* Vendor & evaluasi (FR-7) */}
            <Card className="mt-6 p-5">
              <h3 className="mb-3 text-sm font-semibold text-sand-900">
                Vendor
              </h3>
              {campaign.vendors.length > 0 ? (
                <ScrollList
                  className="space-y-5 pr-1"
                  maxRows={2}
                  rowHeight={30}
                >
                  {campaign.vendors.map((vendor) => {
                    const evaluation = campaign.evaluations.find(
                      (item) => item.vendorId === vendor.id,
                    );
                    const vendorVariants = campaign.variants.filter(
                      (variant) => variant.vendor?.id === vendor.id,
                    );
                    return (
                      <section key={vendor.id} className="rounded-xl border border-sand-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/vendor/${vendor.id}`}
                              className="font-semibold text-sand-900 hover:underline"
                            >
                              {vendor.nama}
                            </Link>
                            <p className="mt-1 text-sm text-amber-600">
                              {ratingStars(computeVendorStats(vendor.evaluations).avgRating)}
                            </p>
                          </div>
                          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-sand-600">
                            {vendorVariants.length} item
                          </span>
                        </div>
                        {vendorVariants.length > 0 && (
                          <p className="mt-2 text-xs text-sand-600">
                            {vendorVariants.map((variant) => variant.namaVarian).join(", ")}
                          </p>
                        )}

                        <div className="mt-4 border-t border-sand-100 pt-4">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sand-500">
                            {evaluation ? "Evaluasi vendor" : "Isi evaluasi vendor"}
                          </p>
                          {campaign.status !== "SELESAI" && !evaluation && (
                            <p className="mb-2 text-xs text-sand-500">
                              Biasanya diisi setelah Batch PO berstatus Selesai.
                            </p>
                          )}
                          <EvaluationForm
                            campaignId={id}
                            vendorId={vendor.id}
                            initial={evaluation}
                          />
                          {evaluation && (
                            <p className="mt-2 text-xs text-sand-500">
                              {KETEPATAN_LABEL[evaluation.ketepatanWaktu]} ·{" "}
                              {KUALITAS_LABEL[evaluation.kesesuaianKualitas]}
                            </p>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </ScrollList>
              ) : (
                <p className="text-sm text-sand-500">
                  Belum ada vendor.{" "}
                  <Link
                    href={`/pre-orders/${id}/edit`}
                    className="text-sand-700 underline"
                  >
                    Pilih vendor
                  </Link>{" "}
                  lewat edit Batch PO.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "pesanan" && (
        <Card>
          <CardHeader
            title="Pesanan"
            subtitle={`${ordersEnvelope?.meta.total ?? 0} pesanan ditemukan`}
            action={
              <LinkButton href={`/pre-orders/${id}/pesanan/baru`}>
                + Tambah Pesanan
              </LinkButton>
            }
          />
          {/* Filter */}
          <form className="grid grid-cols-2 gap-2.5 border-b border-sand-100 px-3.5 py-3.5 sm:gap-3 sm:px-5 sm:py-4 md:grid-cols-3 xl:grid-cols-6">
            <input type="hidden" name="tab" value="pesanan" />
            <label className="col-span-2 text-xs font-medium text-sand-500 md:col-span-2">
              Cari pesanan
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Nama, email, nomor pesanan, SKU, resi" className="mt-1 block min-h-9 w-full rounded-lg border border-sand-300 px-2.5 text-xs text-sand-900 sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm" />
            </label>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-500">
                Status
              </label>
              <select
                name="status"
                defaultValue={sp.status ?? ""}
                className="min-h-9 w-full rounded-lg border border-sand-300 px-2.5 text-xs sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
              >
                <option value="">Semua status</option>
                {ORDER_FILTERS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-500">
                Varian
              </label>
              <select
                name="variant"
                defaultValue={sp.variant ?? ""}
                className="min-h-9 w-full rounded-lg border border-sand-300 px-2.5 text-xs sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
              >
                <option value="">Semua varian</option>
                {campaign.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.namaVarian}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-500">Pembayaran</label>
              <select name="payment" defaultValue={sp.payment ?? ""} className="min-h-9 w-full rounded-lg border border-sand-300 px-2.5 text-xs sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm">
                <option value="">Semua pembayaran</option>
                <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
                <option value="VERIFIED">Terverifikasi</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-500">Pengiriman</label>
              <select name="shipping" defaultValue={sp.shipping ?? ""} className="min-h-9 w-full rounded-lg border border-sand-300 px-2.5 text-xs sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm">
                <option value="">Semua pengiriman</option>
                <option value="SHOPEE">Shopee</option>
                <option value="COURIER">Manual/Ekspedisi</option>
                <option value="NONE">Belum dipilih</option>
              </select>
            </div>
            <div className="col-span-2 flex items-end gap-2 md:col-span-3 xl:col-span-6">
            <button
              type="submit"
              className="min-h-9 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700 sm:min-h-0 sm:py-1.5 sm:text-sm"
            >
              Terapkan
            </button>
            {(sp.q || sp.status || sp.payment || sp.variant || sp.shipping) && (
              <Link
                href={tabHref("pesanan")}
                className="px-2 py-1.5 text-xs text-sand-500 hover:text-sand-700 sm:text-sm"
              >
                Reset
              </Link>
            )}
            </div>
          </form>

          {orders.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan"
              description="Belum ada pesanan yang cocok dengan filter."
            />
          ) : (
            <>
              <OrderBulkTable campaignId={id} rows={orderRows} />
              {session?.role === "ADMIN" && (
                <div className="border-t border-sand-200 bg-rose-50/40 p-4">
                  <h3 className="font-extrabold text-sand-900">Pembersihan pesanan invalid</h3>
                  <p className="mt-1 text-xs text-sand-500">Order tanpa payment/shipment dihapus permanen. Order dengan histori finansial hanya dibatalkan dan diarsipkan.</p>
                  <div className="mt-3 space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-sand-200 bg-white p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-sand-900">{order.namaPembeli}</p><p className="font-mono text-xs text-sand-500">{order.id}</p></div><span className="text-xs font-bold text-sand-500">{ORDER_STATUS_LABEL[order.status]}</span></div>
                        <DestructiveActionForm action={removeInvalidOrder.bind(null, id, order.id)} target={order.id} label="Bersihkan pesanan" compact />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(ordersEnvelope?.meta.totalPages ?? 0) > 1 && (
                <nav className="flex items-center justify-center gap-3 border-t border-sand-100 px-5 py-4 text-sm font-bold" aria-label="Navigasi halaman pesanan">
                  {requestedPage > 1 ? <Link href={ordersHref(requestedPage - 1)} className="rounded-lg border border-sand-200 px-3 py-2">Sebelumnya</Link> : <span />}
                  <span className="text-sand-500">Halaman {ordersEnvelope?.meta.page} dari {ordersEnvelope?.meta.totalPages}</span>
                  {requestedPage < (ordersEnvelope?.meta.totalPages ?? 1) ? <Link href={ordersHref(requestedPage + 1)} className="rounded-lg border border-sand-200 px-3 py-2">Berikutnya</Link> : <span />}
                </nav>
              )}
            </>
          )}
        </Card>
      )}

      {tab === "timeline" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Riwayat timeline" subtitle="Kronologis, terbaru di atas" />
              {campaign.timelineEntries.length === 0 ? (
                <EmptyState title="Belum ada update timeline" />
              ) : (
                <ScrollList maxRows={12} rowHeight={4}>
                <ol className="relative space-y-5 px-6 py-5">
                  {campaign.timelineEntries.map((e) => (
                    <li key={e.id} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sand-900">
                          {e.judulUpdate}
                        </p>
                        {e.otomatis && (
                          <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-sand-500">
                            otomatis
                          </span>
                        )}
                        {e.milestoneCode && (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                            {MILESTONE_LABEL[e.milestoneCode] ?? e.milestoneCode.replaceAll("_", " ")}
                          </span>
                        )}
                      </div>
                      {e.catatan && (
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-sand-600">
                          {e.catatan}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-sand-400">
                        {formatWaktu(e.createdAt)}
                        {e.dibuatOleh?.name ? ` · ${e.dibuatOleh.name}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
                </ScrollList>
              )}
            </Card>
          </div>
          <div>
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-sand-900">
                Tambah update
              </h3>
              <TimelineForm campaignId={id} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-sand-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sand-700">{value}</dd>
    </div>
  );
}

// Label DP sesuai tipe; nilai nominal selalu berlaku per unit produk.
function dpLabel(c: {
  paymentScheme: PaymentScheme;
  dpTipe: DpTipe | null;
  dpPercent: number | null;
  dpNominal: string | null;
}): string | null {
  if (c.paymentScheme !== "DP_PELUNASAN") return null;
  if (c.dpTipe === "NOMINAL") {
    return c.dpNominal != null ? `DP ${formatRupiah(c.dpNominal)} / unit` : null;
  }
  return c.dpPercent != null ? `DP ${c.dpPercent}%` : null;
}
