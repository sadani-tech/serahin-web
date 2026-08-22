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
  title: "Formulir Pesanan — Serahin",
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
  variants: {
    id: string;
    namaVarian: string;
    sisa: number;
    harga: number;
    gambarUrl: string | null;
    images: string[];
    warna: string[];
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

  return (
    <div className="bg-serahin-dots relative min-h-full py-10">
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-72"
      />
      <div className="relative mx-auto max-w-lg space-y-6 px-4">
        <div className="flex flex-col items-center text-center">
          <SerahinLogo size="md" layout="stacked" />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700 ring-1 ring-brand-200">
            Formulir Pre-Order
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-sand-900">
            {data.namaProduk}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-sand-600">
            {formatRupiah(data.harga)} / unit ·{" "}
            {PAYMENT_SCHEME_LABEL[data.paymentScheme]}
          </p>
          {data.tanggalTutup && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1 text-xs font-bold text-sun-800 ring-1 ring-sun-600/25">
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
        </div>

        {data.deskripsi && !isRichTextEmpty(data.deskripsi) && (
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <RichText html={data.deskripsi} />
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg">
          <div aria-hidden="true" className="bg-serahin-ribbon h-1.5 w-full" />
          <div className="p-6">
          {!data.bukaPesanan ? (
            <p className="text-center text-sm text-sand-600">
              Maaf, formulir pesanan untuk kampanye ini sedang tidak aktif.
            </p>
          ) : !adaSisa ? (
            <p className="text-center text-sm text-rose-600">
              Semua varian sudah habis kuotanya.
            </p>
          ) : (
            <PublicOrderForm formToken={token} variants={data.variants} />
          )}
          </div>
        </div>

        <p className="text-center text-xs text-sand-500">
          Pesanan Anda akan diverifikasi Admin terlebih dahulu. Setelah kirim,
          Anda akan mendapat link untuk memantau status pesanan.
        </p>

        <PublicFaq campaignId={data.id} />

        <PublicFooter />
      </div>
    </div>
  );
}
