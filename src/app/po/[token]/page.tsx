import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import type { PaymentScheme } from "@/lib/types";
import { RichText } from "@/components/RichText";
import { PublicFaq } from "@/components/PublicFaq";
import { PublicFooter } from "@/components/PublicFooter";
import { SerahinLogo } from "@/components/brand";
import { isRichTextEmpty } from "@/lib/sanitize";
import { PublicOrderForm } from "./PublicOrderForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Pre-Order — Serahin",
  robots: { index: false, follow: false },
};

type FormInfo = {
  id: string;
  namaProduk: string;
  deskripsi: string | null;
  harga: number;
  paymentScheme: PaymentScheme;
  tanggalTutup: string | null;
  bukaPesanan: boolean;
  gatewayEnabled?: boolean;
  variants: {
    id: string;
    namaVarian: string;
    sisa: number;
    harga: number;
    gambarUrl: string | null;
    images: string[];
    warna: string[];
    kategori: string;
    label: string | null;
    ukuran: string | null;
    material: string | null;
    sku: string | null;
    deskripsi: string | null;
  }[];
};

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let data: FormInfo;
  try {
    data = await api.get<FormInfo>(`/public/form/${token}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const adaSisa = data.variants.some((v) => v.sisa > 0);
  const hargaVarian = data.variants.map((v) => v.harga);
  const hargaTerendah = Math.min(...hargaVarian);
  const hargaTertinggi = Math.max(...hargaVarian);
  const labelHarga =
    hargaVarian.length === 0
      ? formatRupiah(data.harga)
      : hargaTerendah === hargaTertinggi
        ? formatRupiah(hargaTerendah)
        : `${formatRupiah(hargaTerendah)} – ${formatRupiah(hargaTertinggi)}`;
  const alasanTidakBisaPesan = !data.bukaPesanan
    ? "Maaf, formulir pesanan untuk kampanye ini sedang tidak aktif."
    : !adaSisa
      ? "Semua varian sudah habis kuotanya."
      : undefined;

  return (
    <div className="bg-serahin-dots relative min-h-full pb-10">
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-72"
      />
      <main className="relative mx-auto max-w-6xl space-y-7 px-4 pt-7 sm:px-6 sm:pt-10">
        <section className="mx-auto max-w-3xl text-center">
          <SerahinLogo size="md" layout="stacked" />
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700 ring-1 ring-brand-200">
              Katalog Pre-Order
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-sand-900 sm:text-4xl">
            {data.namaProduk}
          </h1>
          <p className="mt-2 text-base font-bold text-brand-700 sm:text-lg">
            {labelHarga} <span className="text-sand-400">·</span>{" "}
            {PAYMENT_SCHEME_LABEL[data.paymentScheme]}
          </p>
          {data.tanggalTutup && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1.5 text-xs font-bold text-sun-800 ring-1 ring-sun-600/25">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              PO ditutup {formatTanggal(data.tanggalTutup)}
            </p>
          )}
        </section>

        {data.deskripsi && !isRichTextEmpty(data.deskripsi) && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
            <RichText html={data.deskripsi} />
          </div>
        )}

        <PublicOrderForm
          formToken={token}
          variants={data.variants}
          gatewayEnabled={Boolean(data.gatewayEnabled)}
          orderingDisabled={Boolean(alasanTidakBisaPesan)}
          unavailableMessage={alasanTidakBisaPesan}
        />

        <p className="mx-auto max-w-xl text-center text-xs text-sand-500">
          Pesanan Anda akan diverifikasi Admin terlebih dahulu. Setelah kirim,
          Anda akan mendapat link untuk memantau status pesanan.
        </p>

        <PublicFaq campaignId={data.id} />
        <PublicFooter />
      </main>
    </div>
  );
}
