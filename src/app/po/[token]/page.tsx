import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal, toNumber } from "@/lib/format";
import { PAYMENT_SCHEME_LABEL, ORDER_STATUS_NONAKTIF } from "@/lib/domain";
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

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { formToken: token },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
        include: {
          orderItems: {
            where: { order: { status: { notIn: ORDER_STATUS_NONAKTIF } } },
            select: { jumlah: true },
          },
        },
      },
    },
  });
  if (!campaign) notFound();

  const bukaPesanan = campaign.status === "OPEN" && campaign.formAktif;
  const variantOptions = campaign.variants.map((v) => ({
    id: v.id,
    namaVarian: v.namaVarian,
    sisa: v.kuotaMaks - v.orderItems.reduce((s, o) => s + o.jumlah, 0),
    harga: toNumber(v.harga),
    gambarUrl: v.gambarUrl,
  }));
  const adaSisa = variantOptions.some((v) => v.sisa > 0);

  return (
    <div className="min-h-full bg-slate-50 py-10">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Serahin · Formulir Pre-Order
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {campaign.namaProduk}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatRupiah(campaign.harga)} / unit ·{" "}
            {PAYMENT_SCHEME_LABEL[campaign.paymentScheme]}
          </p>
          {campaign.tanggalTutup && (
            <p className="mt-0.5 text-xs text-slate-400">
              PO ditutup: {formatTanggal(campaign.tanggalTutup)}
            </p>
          )}
        </div>

        {campaign.deskripsi && !isRichTextEmpty(campaign.deskripsi) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <RichText html={campaign.deskripsi} />
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {!bukaPesanan ? (
            <p className="text-center text-sm text-slate-600">
              Maaf, formulir pesanan untuk kampanye ini sedang tidak aktif.
            </p>
          ) : !adaSisa ? (
            <p className="text-center text-sm text-rose-600">
              Semua varian sudah habis kuotanya.
            </p>
          ) : (
            <PublicOrderForm formToken={token} variants={variantOptions} />
          )}
        </div>

        <PublicFaq campaignId={campaign.id} />

        <p className="text-center text-xs text-slate-400">
          Pesanan Anda akan diverifikasi Admin terlebih dahulu. Setelah kirim,
          Anda akan mendapat link untuk memantau status pesanan.
        </p>

        <PublicFooter />
      </div>
    </div>
  );
}
