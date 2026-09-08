import Link from "next/link";
import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { SerahinLogo } from "@/components/brand";
import { PublicFooter } from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pembayaran — Serahin",
  robots: { index: false, follow: false },
};

type ReconcileResult = { status: string; orderToken: string | null };

// Duitku mengarahkan browser ke sini setelah pembeli membayar, dengan query
// ?merchantOrderId=&resultCode=&reference=. Kita verifikasi ulang ke backend
// (yang men-sync langsung ke provider) — query hanya petunjuk, bukan sumber
// kebenaran.
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const gatewayOrderId = first(sp.merchantOrderId) ?? first(sp.ref);
  const tokenHint = first(sp.token);

  let result: ReconcileResult | null = null;
  let errorMsg: string | null = null;

  if (gatewayOrderId) {
    try {
      result = await api.post<ReconcileResult>(
        "/public/payment-gateway/reconcile",
        { gatewayOrderId },
      );
    } catch (e) {
      errorMsg =
        e instanceof ApiError
          ? e.message
          : "Tidak bisa memeriksa status pembayaran saat ini.";
    }
  }

  const orderToken = result?.orderToken ?? tokenHint ?? null;
  const paid = result?.status === "PAID";
  const failed = result?.status === "EXPIRED" || result?.status === "FAILED";

  const { judul, pesan, tone } = paid
    ? {
        judul: "Pembayaran berhasil",
        pesan:
          "Terima kasih! Pembayaran Anda sudah kami terima dan pesanan otomatis diperbarui.",
        tone: "emerald" as const,
      }
    : failed
      ? {
          judul: "Pembayaran tidak selesai",
          pesan:
            "Pembayaran gagal atau tautannya kedaluwarsa. Anda bisa mengulang pembayaran dari halaman pesanan.",
          tone: "rose" as const,
        }
      : {
          judul: "Pembayaran sedang diproses",
          pesan:
            "Kami belum menerima konfirmasi dari penyedia pembayaran. Ini biasanya hanya sebentar — buka halaman pesanan Anda untuk memeriksa lagi.",
          tone: "amber" as const,
        };

  const toneRing = {
    emerald: "ring-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "ring-rose-200 bg-rose-50 text-rose-800",
    amber: "ring-amber-200 bg-amber-50 text-amber-800",
  }[tone];

  return (
    <div className="bg-serahin-dots relative min-h-full py-10">
      <div
        aria-hidden="true"
        className="bg-serahin-sunburst pointer-events-none absolute inset-x-0 top-0 h-72"
      />
      <div className="relative mx-auto max-w-md space-y-6 px-4">
        <div className="flex flex-col items-center text-center">
          <SerahinLogo size="md" layout="stacked" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg">
          <div aria-hidden="true" className="bg-serahin-ribbon h-1.5 w-full" />
          <div className="space-y-4 p-6 text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-sand-900">
              {judul}
            </h1>
            <p
              className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${toneRing}`}
            >
              {pesan}
            </p>
            {errorMsg && (
              <p className="text-xs text-sand-500">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {orderToken ? (
                <Link
                  href={`/portal/${orderToken}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand hover:bg-brand-700"
                >
                  Lihat status pesanan
                </Link>
              ) : (
                <p className="text-xs text-sand-500">
                  Buka kembali tautan pantau pesanan yang Anda terima untuk
                  memeriksa status.
                </p>
              )}
            </div>
          </div>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}
