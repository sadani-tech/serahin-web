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
import { TimelineForm } from "./TimelineForm";
import { FormPublikControl } from "./FormPublikControl";
import { EvaluationForm } from "./EvaluationForm";
import { OrderBulkTable, type OrderRow } from "@/components/OrderBulkTable";

export const dynamic = "force-dynamic";

type Tab = "info" | "pesanan" | "timeline";

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
  variants: {
    id: string;
    namaVarian: string;
    kuotaMaks: number;
    harga: string;
    hargaPerluTinjau: boolean;
  }[];
  timelineEntries: {
    id: string;
    judulUpdate: string;
    catatan: string | null;
    otomatis: boolean;
    createdAt: string;
    dibuatOleh: { name: string } | null;
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
  vendor: { id: string; nama: string; evaluations: EvalInput[] } | null;
  evaluation: {
    ketepatanWaktu: KetepatanWaktu;
    jumlahHariTelat: number | null;
    kesesuaianKualitas: KesesuaianKualitas;
    rating: number;
    catatan: string | null;
  } | null;
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; status?: string; variant?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = (["info", "pesanan", "timeline"].includes(sp.tab ?? "")
    ? sp.tab
    : "info") as Tab;

  let campaign: CampaignDetail;
  try {
    campaign = await api.get<CampaignDetail>(`/kampanye/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

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
    new Date(campaign.deadlinePelunasan).getTime() < Date.now();

  const tabHref = (t: Tab) => `/kampanye/${id}?tab=${t}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/kampanye"
          className="text-sm text-sand-500 hover:text-sand-700"
        >
          ← Daftar kampanye
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
          <div className="flex gap-2">
            <LinkButton
              href={`/kampanye/${id}/edit`}
              variant="secondary"
            >
              Edit
            </LinkButton>
            <LinkButton
              href={`/import/kampanye/${id}`}
              variant="secondary"
            >
              Impor Pesanan
            </LinkButton>
            <LinkButton href={`/kampanye/${id}/pesanan/baru`}>
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
              <CardHeader title="Detail kampanye" />
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
              <ScrollList className="divide-y divide-sand-100">
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
              {campaign.vendor ? (
                <>
                  <Link
                    href={`/vendor/${campaign.vendor.id}`}
                    className="font-medium text-sand-900 hover:underline"
                  >
                    {campaign.vendor.nama}
                  </Link>
                  <p className="mt-1 text-sm text-amber-600">
                    {ratingStars(
                      computeVendorStats(campaign.vendor.evaluations).avgRating,
                    )}
                  </p>

                  <div className="mt-4 border-t border-sand-100 pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sand-500">
                      {campaign.evaluation
                        ? "Evaluasi vendor"
                        : "Isi evaluasi vendor"}
                    </p>
                    {campaign.status !== "SELESAI" && !campaign.evaluation && (
                      <p className="mb-2 text-xs text-sand-500">
                        Biasanya diisi setelah kampanye berstatus Selesai.
                      </p>
                    )}
                    <EvaluationForm
                      campaignId={id}
                      initial={
                        campaign.evaluation
                          ? {
                              ketepatanWaktu: campaign.evaluation.ketepatanWaktu,
                              jumlahHariTelat: campaign.evaluation.jumlahHariTelat,
                              kesesuaianKualitas:
                                campaign.evaluation.kesesuaianKualitas,
                              rating: campaign.evaluation.rating,
                              catatan: campaign.evaluation.catatan,
                            }
                          : undefined
                      }
                    />
                    {campaign.evaluation && (
                      <p className="mt-2 text-xs text-sand-500">
                        {KETEPATAN_LABEL[campaign.evaluation.ketepatanWaktu]} ·{" "}
                        {KUALITAS_LABEL[campaign.evaluation.kesesuaianKualitas]}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-sand-500">
                  Belum ada vendor.{" "}
                  <Link
                    href={`/kampanye/${id}/edit`}
                    className="text-sand-700 underline"
                  >
                    Pilih vendor
                  </Link>{" "}
                  lewat edit kampanye.
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
              <LinkButton href={`/kampanye/${id}/pesanan/baru`}>
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
