"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Button, Field, FormError, Textarea } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FileUploadField } from "@/components/FileUploadField";
import { ToastFeedback } from "@/components/Toast";
import { formatRupiah } from "@/lib/format";
import { METODE_PENGIRIMAN_LABEL } from "@/lib/domain";
import type { MetodePengiriman } from "@/lib/types";
import {
  startPortalGatewayPayment,
  submitPortalPayment,
  type PortalPaymentState,
} from "../actions";

// Form pelunasan/pembayaran mandiri pembeli di portal. Ditampilkan hanya bila
// masih ada sisa tagihan & tidak ada pembayaran yang menunggu verifikasi.
// Pada tahap pelunasan (isPelunasan), pembeli wajib memilih metode pengiriman;
// opsi Ekspedisi mewajibkan alamat lengkap, Shopee tidak butuh alamat (v1.8).
//
// Kanal pembayaran dikunci mengikuti pilihan saat checkout. Portal tidak
// menawarkan perpindahan dari transfer manual ke gateway atau sebaliknya.
export function PortalPaymentForm({
  token,
  amountDue,
  isPelunasan,
  paymentChannel,
  gatewayAvailable = false,
  manualTransfer,
  linkCheckoutShopee,
  resumePayment = false,
}: {
  token: string;
  amountDue: number;
  isPelunasan: boolean;
  paymentChannel: "MANUAL_TRANSFER" | "GATEWAY";
  gatewayAvailable?: boolean;
  manualTransfer?: {
    bankName: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
  } | null;
  linkCheckoutShopee?: string | null;
  resumePayment?: boolean;
}) {
  const manualAction = submitPortalPayment.bind(null, token);
  const [state, formAction, manualPending] = useActionState<
    PortalPaymentState,
    FormData
  >(manualAction, undefined);
  const gatewayAction = startPortalGatewayPayment.bind(null, token);
  const [gwState, gwFormAction, gwPending] = useActionState<
    PortalPaymentState,
    FormData
  >(gatewayAction, undefined);

  const pending = manualPending || gwPending;
  const gateway = paymentChannel === "GATEWAY";
  const manualAccountReady = Boolean(
    manualTransfer?.bankName &&
      manualTransfer.accountNumber &&
      manualTransfer.accountHolderName,
  );
  const jumlah = String(amountDue);
  const [metode, setMetode] = useState<MetodePengiriman | "">("");
  const [alamat, setAlamat] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();
  const paymentAttemptKey = useRef<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPelunasan) {
      if (!metode) {
        setLocalError("Pilih metode pengiriman terlebih dahulu.");
        return;
      }
      if (metode === "EKSPEDISI" && !alamat.trim()) {
        setLocalError(
          "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi.",
        );
        return;
      }
    }
    setLocalError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("jumlahBayar", jumlah);
    if (gateway) {
      paymentAttemptKey.current ??= crypto.randomUUID();
      fd.set("idempotencyKey", paymentAttemptKey.current);
    }
    if (isPelunasan && metode) {
      fd.set("metodePengiriman", metode);
      fd.set("alamatPengiriman", metode === "EKSPEDISI" ? alamat.trim() : "");
    }
    startTransition(() => (gateway ? gwFormAction(fd) : formAction(fd)));
  }

  const errorMessage = localError ?? state?.error ?? gwState?.error;

  useEffect(() => {
    if (!resumePayment && !errorMessage) return;
    const timer = window.setTimeout(() => {
      document.getElementById("portal-payment-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, resumePayment ? 150 : 0);
    return () => window.clearTimeout(timer);
  }, [errorMessage, resumePayment]);

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
        <ToastFeedback success="Pembayaran terkirim dan sedang menunggu verifikasi Admin." />
        Pembayaran Anda terkirim dan sedang menunggu verifikasi Admin. Status
        akan diperbarui setelah diverifikasi.
      </div>
    );
  }

  return (
    <form id="portal-payment-form" onSubmit={handleSubmit} className="scroll-mt-24 space-y-3">
      {errorMessage && <FormError message={errorMessage} />}

      <div className={`rounded-xl px-4 py-3 ring-1 ring-inset ${gateway ? "bg-brand-50 text-brand-900 ring-brand-200" : "bg-sun-50 text-sun-950 ring-sun-200"}`}>
        <p className="text-xs font-extrabold uppercase tracking-wider">
          {gateway ? "Pembayaran otomatis" : "Rekening tujuan Seller"}
        </p>
        {gateway ? (
          <p className={`mt-1 text-sm ${gatewayAvailable ? "" : "font-bold text-rose-700"}`}>
            {gatewayAvailable
              ? "Metode pembayaran mengikuti pilihan saat checkout dan diproses melalui payment gateway."
              : "Payment gateway sedang tidak tersedia. Coba lagi beberapa saat atau hubungi Seller."}
          </p>
        ) : manualAccountReady ? (
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-xs opacity-70">Bank</dt><dd className="font-extrabold">{manualTransfer!.bankName}</dd></div>
            <div><dt className="text-xs opacity-70">Nomor rekening</dt><dd className="font-mono text-base font-extrabold tracking-wide">{manualTransfer!.accountNumber}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs opacity-70">Atas nama</dt><dd className="font-extrabold">{manualTransfer!.accountHolderName}</dd></div>
          </dl>
        ) : (
          <p className="mt-1 text-sm font-bold text-rose-700">Rekening Seller belum tersedia. Hubungi Seller sebelum melakukan transfer.</p>
        )}
      </div>

      {isPelunasan && (
        <Field
          label="Metode pengiriman"
          required
          hint="Pilih salah satu opsi pengiriman untuk pelunasan."
        >
          <div className="space-y-2">
            {(Object.keys(METODE_PENGIRIMAN_LABEL) as MetodePengiriman[]).map(
              (opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    metode === opt
                      ? "border-brand-500 bg-sand-50 ring-1 ring-brand-500"
                      : "border-sand-200 hover:border-sand-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodePengirimanRadio"
                    value={opt}
                    checked={metode === opt}
                    onChange={() => setMetode(opt)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="font-medium text-sand-800">
                    {METODE_PENGIRIMAN_LABEL[opt]}
                  </span>
                </label>
              ),
            )}
          </div>
        </Field>
      )}

      {isPelunasan && metode === "EKSPEDISI" && (
        <Field
          label="Alamat pengiriman lengkap"
          required
          hint="Tulis Nama, Nomor HP, dan alamat lengkap untuk pengiriman ekspedisi."
        >
          <Textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={4}
            placeholder="Nama · No HP · Alamat lengkap (jalan, kecamatan, kota, kode pos)"
            required
          />
        </Field>
      )}

      {isPelunasan && metode === "SHOPEE" && (
        <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm ring-1 ring-inset ring-orange-200">
          {linkCheckoutShopee ? (
            <>
              <p className="text-orange-800">
                Lakukan checkout melalui Shopee, lalu{" "}
                {gateway ? "selesaikan pembayaran di bawah" : "unggah bukti transfernya di bawah"}.
              </p>
              <a
                href={linkCheckoutShopee}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-orange-700 underline"
              >
                Checkout di Shopee →
              </a>
            </>
          ) : (
            <p className="text-orange-800">
              Silakan lakukan checkout via Shopee sesuai instruksi penjual di
              atas, lalu {gateway ? "selesaikan pembayaran" : "unggah bukti transfernya"} di bawah.
            </p>
          )}
        </div>
      )}

      <Field
        label="Jumlah yang dibayar"
        required
        hint={
          jumlah
            ? `= ${formatRupiah(Number(jumlah))}`
            : gateway
              ? "Nominal yang akan ditagih."
              : "Nominal sesuai bukti transfer."
        }
      >
        <CurrencyInput
          name="jumlahBayar"
          required
          value={jumlah}
          readOnly
          className="bg-sand-50 font-bold"
        />
      </Field>

      {gateway ? (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
          Anda akan diarahkan ke halaman pembayaran (QRIS / Virtual Account /
          e-wallet / kartu). Pembayaran terverifikasi otomatis — tanpa unggah
          bukti.
        </p>
      ) : (
        <FileUploadField
          name="bukti"
          label="Bukti transfer"
          hint="JPG, PNG, WEBP, atau PDF (maks 5MB)."
          required
        />
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || (gateway ? !gatewayAvailable : !manualAccountReady)}
      >
        {pending
          ? gateway
            ? "Mengarahkan…"
            : "Mengirim…"
          : gateway
            ? "Bayar Sekarang"
            : isPelunasan
              ? "Kirim pelunasan"
              : "Kirim pembayaran"}
      </Button>
      <p className="text-center text-xs text-sand-400">
        {gateway
          ? "Pembayaran diproses oleh penyedia pembayaran tepercaya."
          : "Pembayaran akan diverifikasi Admin terlebih dahulu."}
      </p>
    </form>
  );
}
