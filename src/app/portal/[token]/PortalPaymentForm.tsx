"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, FormError, Textarea } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FileUploadField } from "@/components/FileUploadField";
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
// v2.1 — bila gatewayEnabled, pembeli bisa memilih "Bayar otomatis" (QRIS / VA /
// e-wallet / kartu) yang mengarahkan ke halaman pembayaran; atau tetap transfer
// manual + unggah bukti seperti sebelumnya.
export function PortalPaymentForm({
  token,
  sisa,
  isPelunasan,
  gatewayEnabled = false,
  linkCheckoutShopee,
}: {
  token: string;
  sisa: number;
  isPelunasan: boolean;
  gatewayEnabled?: boolean;
  linkCheckoutShopee?: string | null;
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
  const [metodeBayar, setMetodeBayar] = useState<"GATEWAY" | "MANUAL">(
    gatewayEnabled ? "GATEWAY" : "MANUAL",
  );
  const gateway = gatewayEnabled && metodeBayar === "GATEWAY";
  const [jumlah, setJumlah] = useState(String(sisa));
  const [metode, setMetode] = useState<MetodePengiriman | "">("");
  const [alamat, setAlamat] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();

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
    if (isPelunasan && metode) {
      fd.set("metodePengiriman", metode);
      fd.set("alamatPengiriman", metode === "EKSPEDISI" ? alamat.trim() : "");
    }
    startTransition(() => (gateway ? gwFormAction(fd) : formAction(fd)));
  }

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
        Pembayaran Anda terkirim dan sedang menunggu verifikasi Admin. Status
        akan diperbarui setelah diverifikasi.
      </div>
    );
  }

  const errorMessage = localError ?? state?.error ?? gwState?.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errorMessage && <FormError message={errorMessage} />}

      {gatewayEnabled && (
        <Field label="Metode pembayaran" required>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["GATEWAY", "Bayar otomatis", "QRIS / VA / e-wallet / kartu"],
                ["MANUAL", "Transfer manual", "Transfer bank + unggah bukti"],
              ] as const
            ).map(([value, judul, sub]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  metodeBayar === value
                    ? "border-brand-500 bg-sand-50 ring-1 ring-brand-500"
                    : "border-sand-200 hover:border-sand-300"
                }`}
              >
                <input
                  type="radio"
                  name="metodeBayarRadio"
                  value={value}
                  checked={metodeBayar === value}
                  onChange={() => setMetodeBayar(value)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="block font-medium text-sand-800">
                    {judul}
                  </span>
                  <span className="block text-xs text-sand-500">{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>
      )}

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
          onValueChange={setJumlah}
          placeholder="0"
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

      <Button type="submit" className="w-full" disabled={pending}>
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
