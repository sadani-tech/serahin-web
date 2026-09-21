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
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import {
  CAMPAIGN_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_SCHEME_LABEL,
  orderAktif,
} from "@/lib/domain";
import { computeBilling } from "@/lib/billing";
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
  PaymentVerification,
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
import { ProductDeleteButton } from "./ProductDeleteButton";
import { TimelineDeleteButton } from "./TimelineDeleteButton";

export const dynamic = "force-dynamic";

type Tab = "info" | "produk" | "pesanan" | "timeline";

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
  productCount: number;
  activeProductCount: number;
  needsProducts: boolean;
  variants: {
    id: string;
    namaVarian: string;
    kuotaMaks: number;
    harga: string;
    hargaPerluTinjau: boolean;
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
  orders: {
    id: string;
    namaPembeli: string;
    kontak: string;
    status: OrderStatus;
    items: {
      variantId: string;
      jumlah: number;
      hargaSaatPesan: string;
      variant: { id: string; namaVarian: string };
    }[];
    payments: { jumlah: string; statusVerifikasi: PaymentVerification }[];
  }[];
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

type ProductRow = {
  id: string;
  namaVarian: string;
  harga: string;
  kuotaMaks: number;
  terisi: number;
  gambarUrl: string | null;
  kategori: string | null;
  label: string | null;
  vendor: { id: string; nama: string } | null;
  isActive: boolean;
};

type ProductPage = {
  data: ProductRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    status?: string;
    variant?: string;
    q?: string;
    productStatus?: string;
    page?: string;
    created?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = (
    ["info", "produk", "pesanan", "timeline"].includes(sp.tab ?? "")
      ? sp.tab
      : "info"
  ) as Tab;

  let campaign: CampaignDetail;
  try {
    campaign = await api.get<CampaignDetail>(`/pre-orders/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const productPage = Math.max(1, Number(sp.page ?? 1) || 1);
  const products =
    tab === "produk"
      ? await api.get<ProductPage>(`/pre-orders/${id}/products`, {
          page: productPage,
          limit: 20,
          q: sp.q,
          status: sp.productStatus,
        })
      : null;

  // Kuota terisi per varian (item pesanan aktif) — v1.5.
  const terisiPerVarian = new Map<string, number>();
  for (const o of campaign.orders) {
    if (!orderAktif(o.status)) continue;
    for (const it of o.items) {
      terisiPerVarian.set(
        it.variantId,
        (terisiPerVarian.get(it.variantId) ?? 0) + it.jumlah,
      );
    }
  }
  const kuotaTotal = campaign.variants.reduce((s, v) => s + v.kuotaMaks, 0);
  const kuotaTerisi = campaign.variants.reduce(
    (s, v) => s + (terisiPerVarian.get(v.id) ?? 0),
    0,
  );

  // Filter pesanan (FR-2.4).
  const filterStatus = sp.status as OrderStatus | undefined;
  const filterVariant = sp.variant;
  const orders = campaign.orders.filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterVariant && !o.items.some((it) => it.variantId === filterVariant))
      return false;
    return true;
  });

  // Baris pesanan siap-render untuk tabel bulk (billing dihitung di server).
  const orderRows: OrderRow[] = orders.map((o) => {
    const billing = computeBilling({
      items: o.items,
      paymentScheme: campaign.paymentScheme,
      dpTipe: campaign.dpTipe,
      dpPercent: campaign.dpPercent,
      dpNominal: campaign.dpNominal,
      payments: o.payments,
    });
    return {
      id: o.id,
      namaPembeli: o.namaPembeli,
      kontak: o.kontak,
      varianLabel:
        o.items.length === 1
          ? o.items[0].variant.namaVarian
          : `${o.items.length} varian`,
      totalQty: o.items.reduce((s, it) => s + it.jumlah, 0),
      status: o.status,
      sisa: billing.sisa,
      aktif: orderAktif(o.status),
    };
  });

  const deadlineLewat =
    !!campaign.deadlinePelunasan &&
    // eslint-disable-next-line react-hooks/purity -- server render needs a request-time deadline comparison
    new Date(campaign.deadlinePelunasan).getTime() < Date.now();

  const tabHref = (t: Tab) => `/pre-orders/${id}?tab=${t}`;

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
            {campaign.needsProducts && (
              <p className="mt-3 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                Batch PO ini belum punya Produk aktif dengan kuota tersedia.
                Tambahkan minimal satu Produk sebelum membuka pemesanan publik.
                <Link
                  href={`/pre-orders/${id}?tab=produk`}
                  className="ml-2 underline"
                >
                  Tambah Produk
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/pre-orders/${id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            <DuplicatePreorderButton campaignId={id} />
            <LinkButton href={`/import/pre-orders/${id}`} variant="secondary">
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
            ["produk", `Produk (${campaign.productCount})`],
            ["pesanan", `Pesanan (${campaign.orders.length})`],
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
                <Info
                  label="Harga / unit"
                  value={formatRupiah(campaign.harga)}
                />
                <Info
                  label="Skema pembayaran"
                  value={
                    PAYMENT_SCHEME_LABEL[campaign.paymentScheme] +
                    (dpLabel(campaign) ? ` — ${dpLabel(campaign)}` : "")
                  }
                />
                <Info
                  label="Tanggal buka"
                  value={formatTanggal(campaign.tanggalBuka)}
                />
                <Info
                  label="Tanggal tutup"
                  value={formatTanggal(campaign.tanggalTutup)}
                />
                <Info
                  label="Estimasi produksi"
                  value={formatTanggal(campaign.estimasiProduksi)}
                />
                <Info
                  label="Estimasi kirim"
                  value={formatTanggal(campaign.estimasiKirim)}
                />
                <Info
                  label="Deadline pelunasan"
                  value={
                    <span
                      className={
                        deadlineLewat ? "font-medium text-rose-600" : ""
                      }
                    >
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
                  const terisi = terisiPerVarian.get(v.id) ?? 0;
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
                        <span
                          className={penuh ? "text-rose-600" : "text-sand-600"}
                        >
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
                  {CAMPAIGN_STATUS_LABEL.OPEN} → {CAMPAIGN_STATUS_LABEL.CLOSED}{" "}
                  → {CAMPAIGN_STATUS_LABEL.PRODUKSI} →{" "}
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
                      <section
                        key={vendor.id}
                        className="rounded-xl border border-sand-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/vendor/${vendor.id}`}
                              className="font-semibold text-sand-900 hover:underline"
                            >
                              {vendor.nama}
                            </Link>
                            <p className="mt-1 text-sm text-amber-600">
                              {ratingStars(
                                computeVendorStats(vendor.evaluations)
                                  .avgRating,
                              )}
                            </p>
                          </div>
                          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-sand-600">
                            {vendorVariants.length} item
                          </span>
                        </div>
                        {vendorVariants.length > 0 && (
                          <p className="mt-2 text-xs text-sand-600">
                            {vendorVariants
                              .map((variant) => variant.namaVarian)
                              .join(", ")}
                          </p>
                        )}

                        <div className="mt-4 border-t border-sand-100 pt-4">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sand-500">
                            {evaluation
                              ? "Evaluasi vendor"
                              : "Isi evaluasi vendor"}
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
            subtitle={`${orders.length} pesanan ditampilkan`}
            action={
              <LinkButton href={`/pre-orders/${id}/pesanan/baru`}>
                + Tambah Pesanan
              </LinkButton>
            }
          />
          {/* Filter */}
          <form className="flex flex-wrap items-end gap-3 border-b border-sand-100 px-5 py-4">
            <input type="hidden" name="tab" value="pesanan" />
            <div>
              <label className="mb-1 block text-xs font-medium text-sand-500">
                Status
              </label>
              <select
                name="status"
                defaultValue={filterStatus ?? ""}
                className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
              >
                <option value="">Semua status</option>
                {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
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
                defaultValue={filterVariant ?? ""}
                className="rounded-lg border border-sand-300 px-3 py-1.5 text-sm"
              >
                <option value="">Semua varian</option>
                {campaign.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.namaVarian}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Terapkan
            </button>
            {(filterStatus || filterVariant) && (
              <Link
                href={tabHref("pesanan")}
                className="px-2 py-1.5 text-sm text-sand-500 hover:text-sand-700"
              >
                Reset
              </Link>
            )}
          </form>

          {orders.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan"
              description="Belum ada pesanan yang cocok dengan filter."
            />
          ) : (
            <OrderBulkTable campaignId={id} rows={orderRows} />
          )}
        </Card>
      )}

      {tab === "produk" && products && (
        <Card>
          <CardHeader
            title="Produk"
            subtitle={`${products.meta.total} Produk/Varian`}
            action={
              <LinkButton href={`/pre-orders/${id}/products/new`}>
                + Tambah Produk
              </LinkButton>
            }
          />
          {campaign.needsProducts && (
            <div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Tambahkan Produk aktif dengan kuota tersedia agar Batch PO dapat
              dibuka untuk pemesanan publik.
            </div>
          )}
          <form className="flex flex-wrap items-end gap-3 border-y border-sand-100 px-5 py-4">
            <input type="hidden" name="tab" value="produk" />
            <label className="flex-1 text-xs font-medium text-sand-500">
              Cari Produk, SKU, kategori, atau label
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                className="mt-1 block min-h-10 w-full rounded-lg border border-sand-300 px-3 text-sm text-sand-800"
                placeholder="Cari Produk"
              />
            </label>
            <label className="text-xs font-medium text-sand-500">
              Status
              <select
                name="productStatus"
                defaultValue={sp.productStatus ?? ""}
                className="mt-1 block min-h-10 rounded-lg border border-sand-300 px-3 text-sm text-sand-800"
              >
                <option value="">Semua</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"
            >
              Terapkan
            </button>
            {(sp.q || sp.productStatus) && (
              <Link
                href={tabHref("produk")}
                className="px-2 text-sm text-sand-600 hover:underline"
              >
                Reset
              </Link>
            )}
          </form>
          {products.data.length === 0 ? (
            <EmptyState
              title={
                products.meta.total === 0
                  ? "Batch PO belum memiliki Produk"
                  : "Tidak ada Produk yang cocok"
              }
              description={
                products.meta.total === 0
                  ? "Tambahkan Produk pertama untuk menyiapkan Batch PO."
                  : "Ubah kata kunci atau filter lalu coba lagi."
              }
              action={
                products.meta.total === 0 ? (
                  <LinkButton href={`/pre-orders/${id}/products/new`}>
                    + Tambah Produk pertama
                  </LinkButton>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-sand-500">
                    <th className="px-5 py-3">Produk</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Harga</th>
                    <th className="px-5 py-3">Kuota</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {products.data.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {product.gambarUrl ? (
                            <img
                              src={product.gambarUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-sand-100" />
                          )}
                          <div>
                            <p className="font-semibold text-sand-900">
                              {product.namaVarian}
                            </p>
                            {product.label && (
                              <p className="text-xs text-sand-500">
                                {product.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sand-700">
                        {product.kategori ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sand-700">
                        {formatRupiah(product.harga)}
                      </td>
                      <td className="px-5 py-3 text-sand-700">
                        {product.terisi} / {product.kuotaMaks}
                      </td>
                      <td className="px-5 py-3 text-sand-700">
                        {product.vendor?.nama ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-sand-100 text-sand-600"}`}
                        >
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/pre-orders/${id}/products/${product.id}/edit`}
                          className="mr-2 text-sm font-bold text-brand-700 hover:underline"
                        >
                          Edit
                        </Link>
                        <ProductDeleteButton
                          campaignId={id}
                          productId={product.id}
                          terisi={product.terisi}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {products.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-4 text-sm">
              <Link
                className={
                  products.meta.page <= 1
                    ? "pointer-events-none opacity-40"
                    : "text-brand-700 hover:underline"
                }
                href={`/pre-orders/${id}?tab=produk&page=${products.meta.page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.productStatus ? `&productStatus=${sp.productStatus}` : ""}`}
              >
                ← Sebelumnya
              </Link>
              <span>
                Halaman {products.meta.page} / {products.meta.totalPages}
              </span>
              <Link
                className={
                  products.meta.page >= products.meta.totalPages
                    ? "pointer-events-none opacity-40"
                    : "text-brand-700 hover:underline"
                }
                href={`/pre-orders/${id}?tab=produk&page=${products.meta.page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.productStatus ? `&productStatus=${sp.productStatus}` : ""}`}
              >
                Berikutnya →
              </Link>
            </div>
          )}
        </Card>
      )}

      {tab === "timeline" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Riwayat timeline"
                subtitle="Kronologis, terbaru di atas"
              />
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
                              {e.milestoneCode.replaceAll("_", " ")}
                            </span>
                          )}
                          <TimelineDeleteButton
                            campaignId={id}
                            entryId={e.id}
                          />
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-sand-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sand-700">{value}</dd>
    </div>
  );
}

// Label DP sesuai tipe: "DP 50%" atau "DP Rp100.000"; null bila skema LUNAS.
function dpLabel(c: {
  paymentScheme: PaymentScheme;
  dpTipe: DpTipe | null;
  dpPercent: number | null;
  dpNominal: string | null;
}): string | null {
  if (c.paymentScheme !== "DP_PELUNASAN") return null;
  if (c.dpTipe === "NOMINAL") {
    return c.dpNominal != null ? `DP ${formatRupiah(c.dpNominal)}` : null;
  }
  return c.dpPercent != null ? `DP ${c.dpPercent}%` : null;
}
