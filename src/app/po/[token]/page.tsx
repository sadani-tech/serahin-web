import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL } from "@/lib/domain";
import type { PaymentScheme } from "@/lib/types";
import { RichText } from "@/components/RichText";
import { PublicFaq } from "@/components/PublicFaq";
import { PublicFooter } from "@/components/PublicFooter";
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
    <div className="min-h-full bg-slate-50 py-10">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Serahin · Formulir Pre-Order
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {data.namaProduk}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatRupiah(data.harga)} / unit ·{" "}
            {PAYMENT_SCHEME_LABEL[data.paymentScheme]}
          </p>
          {data.tanggalTutup && (
            <p className="mt-0.5 text-xs text-slate-400">
              PO ditutup: {formatTanggal(data.tanggalTutup)}
            </p>
          )}
        </div>

        {data.deskripsi && !isRichTextEmpty(data.deskripsi) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <RichText html={data.deskripsi} />
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {!data.bukaPesanan ? (
            <p className="text-center text-sm text-slate-600">
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

        <p className="text-center text-xs text-slate-400">
          Pesanan Anda akan diverifikasi Admin terlebih dahulu. Setelah kirim,
          Anda akan mendapat link untuk memantau status pesanan.
        </p>

        <PublicFaq campaignId={data.id} />

        <PublicFooter />
      </div>
    </div>
  );
}
