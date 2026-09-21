"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Button, Field, FormError, Textarea } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { ToastFeedback } from "@/components/Toast";
import { CopyButton } from "@/components/CopyButton";
import { formatRupiah } from "@/lib/format";
import { METODE_PENGIRIMAN_LABEL } from "@/lib/domain";
import type { MetodePengiriman } from "@/lib/types";
import {
  getSettlementPreview,
  startPortalGatewayPayment,
  submitPortalSettlement,
  type PortalPaymentState,
} from "../actions";

type SettlementItem = {
  id: string;
  jumlah: number;
  hargaSaatPesan: string;
  warna: string | null;
  variant: { namaVarian: string; gambarUrl: string | null };
};

// Form pelunasan per produk (v2.3.7) — Buyer checklist item mana yang mau
// dilunasi dulu; nominal transfer/gateway/split Shopee mengikuti pilihan itu,
// bukan selalu seluruh sisa tagihan order. DP tidak lewat form ini — lihat
// PortalPaymentForm untuk tahap DP.
export function PortalSettlementForm({
  token,
  items,
  unsettledItemIds,
  paymentChannel,
  gatewayAvailable = false,
  manualTransfer,
  manualTransfers,
  shopeeEnabled,
  linkCheckoutShopee,
}: {
  token: string;
  items: SettlementItem[];
  unsettledItemIds: string[];
  paymentChannel: "MANUAL_TRANSFER" | "GATEWAY";
  gatewayAvailable?: boolean;
  manualTransfer?: {
    bankName: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
  } | null;
  manualTransfers?: {
    id: string;
    accountType: "BANK" | "EWALLET";
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    isPrimary: boolean;
  }[];
  shopeeEnabled: boolean;
  linkCheckoutShopee?: string | null;
}) {
  const manualAction = submitPortalSettlement.bind(null, token);
  const [state, formAction, manualPending] = useActionState<PortalPaymentState, FormData>(
    manualAction,
    undefined,
  );
  const gatewayAction = startPortalGatewayPayment.bind(null, token);
  const [gwState, gwFormAction, gwPending] = useActionState<PortalPaymentState, FormData>(
    gatewayAction,
    undefined,
  );
  const pending = manualPending || gwPending;
  const gateway = paymentChannel === "GATEWAY";

  const manualAccountReady = Boolean(
    manualTransfer?.bankName && manualTransfer.accountNumber && manualTransfer.accountHolderName,
  );
  const displayedAccounts = manualTransfers?.length
    ? manualTransfers
    : manualTransfer?.bankName && manualTransfer.accountNumber && manualTransfer.accountHolderName
      ? [{
          id: manualTransfer.accountNumber,
          accountType: "BANK" as const,
          bankName: manualTransfer.bankName,
          accountNumber: manualTransfer.accountNumber,
          accountHolderName: manualTransfer.accountHolderName,
          isPrimary: true,
        }]
      : [];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [metode, setMetode] = useState<MetodePengiriman | "">("");
  const [alamat, setAlamat] = useState("");
  const [preview, setPreview] = useState<{ dueTotal: number; shopeeMaxAmount: number; bankAmountIfShopee: number }>({
    dueTotal: 0,
    shopeeMaxAmount: 0,
    bankAmountIfShopee: 0,
  });
  const [previewError, setPreviewError] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | undefined>();
  const paymentAttemptKey = useRef<string | null>(null);

  const activePreview = selected.size === 0 ? { dueTotal: 0, shopeeMaxAmount: 0, bankAmountIfShopee: 0 } : preview;
  const includeShopee = metode === "SHOPEE";
  const shopeeAmount = includeShopee ? activePreview.shopeeMaxAmount : 0;
  const bankAmount = includeShopee ? activePreview.bankAmountIfShopee : activePreview.dueTotal;

  useEffect(() => {
    if (selected.size === 0) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await getSettlementPreview(token, [...selected]);
      if (cancelled) return;
      setPreviewError(result.error);
      setPreview({
        dueTotal: result.dueTotal,
        shopeeMaxAmount: result.shopeeMaxAmount,
        bankAmountIfShopee: result.bankAmountIfShopee,
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selected, token]);

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.size === 0) {
      setLocalError("Pilih minimal satu produk untuk dilunasi.");
      return;
    }
    if (!metode) {
      setLocalError("Pilih metode pengiriman terlebih dahulu.");
      return;
    }
    if (metode === "EKSPEDISI" && !alamat.trim()) {
      setLocalError("Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi.");
      return;
    }
    setLocalError(undefined);
    const fd = new FormData(e.currentTarget);
    if (metode === "SHOPEE") {
      const buktiShopee = fd.get("buktiShopee");
      if (!(buktiShopee instanceof File) || buktiShopee.size === 0) {
        setLocalError("Bukti checkout Shopee wajib diunggah.");
        return;
      }
    }
    for (const id of selected) fd.append("itemIds", id);
    fd.set("metodePengiriman", metode);
    fd.set("alamatPengiriman", metode === "EKSPEDISI" ? alamat.trim() : "");
    if (metode === "SHOPEE") fd.set("includeShopee", "1");
    if (gateway) {
      paymentAttemptKey.current ??= crypto.randomUUID();
      fd.set("idempotencyKey", paymentAttemptKey.current);
    }
    startTransition(() => (gateway ? gwFormAction(fd) : formAction(fd)));
  }

  const errorMessage = localError ?? previewError ?? state?.error ?? gwState?.error;

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
        <ToastFeedback success="Pelunasan terkirim dan sedang menunggu verifikasi Admin." />
        Pelunasan untuk produk yang dipilih terkirim dan sedang menunggu verifikasi Admin.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && <FormError message={errorMessage} />}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sand-500">
          Pilih produk yang sudah siap untuk dilunasi
        </p>
        <div className="divide-y divide-sand-100 rounded-xl border border-sand-200">
          {items.map((item) => {
            const unsettled = unsettledItemIds.includes(item.id);
            const checked = selected.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${unsettled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <input
                  type="checkbox"
                  checked={unsettled ? checked : true}
                  disabled={!unsettled}
                  onChange={() => unsettled && toggleItem(item.id)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sand-800">
                    {item.variant.namaVarian}
                    {item.warna && <span className="ml-2 text-xs text-sand-500">({item.warna})</span>}
                  </span>
                  <span className="text-xs text-sand-500">
                    {item.jumlah} × {formatRupiah(item.hargaSaatPesan)}
                  </span>
                </span>
                {!unsettled && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    Lunas
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {selected.size > 0 && (
        <div className={`rounded-xl px-3 py-2.5 ring-1 ring-inset ${gateway ? "bg-brand-50 text-brand-900 ring-brand-200" : "bg-sun-50 text-sun-950 ring-sun-200"}`}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider">
            {gateway ? "Pembayaran otomatis" : "Rekening tujuan Seller"}
          </p>
          {gateway ? (
            <p className={`mt-1 text-sm ${gatewayAvailable ? "" : "font-bold text-rose-700"}`}>
              {gatewayAvailable
                ? "Nominal mengikuti produk yang dipilih, diproses melalui payment gateway."
                : "Payment gateway sedang tidak tersedia. Coba lagi beberapa saat atau hubungi Seller."}
            </p>
          ) : manualAccountReady ? (
            <div className="mt-1.5 space-y-1">
              {displayedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs"
                  title={`${account.bankName} ${account.accountNumber} a.n. ${account.accountHolderName}`}
                >
                  <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
                    {account.accountType === "EWALLET" ? "E-wallet" : "Bank"}
                  </span>
                  <span className="shrink-0 font-semibold">{account.bankName}</span>
                  <span className="shrink-0 font-mono font-bold tracking-tight">{account.accountNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-[10px]">a.n. {account.accountHolderName}</span>
                  {account.isPrimary && <span className="shrink-0 text-[10px] opacity-70">utama</span>}
                  <CopyButton text={account.accountNumber} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm font-bold text-rose-700">Rekening Seller belum tersedia. Hubungi Seller sebelum melakukan transfer.</p>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <Field label="Metode pengiriman" required hint="Pilih salah satu opsi pengiriman untuk produk yang dilunasi.">
          <div className="space-y-2">
            {(Object.keys(METODE_PENGIRIMAN_LABEL) as MetodePengiriman[])
              .filter((opt) => opt !== "SHOPEE" || (!gateway && shopeeEnabled))
              .map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    metode === opt ? "border-brand-500 bg-sand-50 ring-1 ring-brand-500" : "border-sand-200 hover:border-sand-300"
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
                  <span className="font-medium text-sand-800">{METODE_PENGIRIMAN_LABEL[opt]}</span>
                </label>
              ))}
          </div>
        </Field>
      )}

      {metode === "EKSPEDISI" && (
        <Field label="Alamat pengiriman lengkap" required hint="Tulis Nama, Nomor HP, dan alamat lengkap untuk pengiriman ekspedisi.">
          <Textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={4}
            placeholder="Nama · No HP · Alamat lengkap (jalan, kecamatan, kota, kode pos)"
            required
          />
        </Field>
      )}

      {metode === "SHOPEE" && (
        <div className="space-y-3 rounded-lg bg-orange-50 px-4 py-3 text-sm ring-1 ring-inset ring-orange-200">
          <div>
            <p className="text-orange-800">Checkout via Shopee menutupi sebagian nominal produk yang dipilih.</p>
            {shopeeAmount > 0 && (
              <p className="mt-1 font-semibold text-orange-900">{formatRupiah(shopeeAmount)} dipotong dari pelunasan lewat Shopee.</p>
            )}
            {linkCheckoutShopee && (
              <a href={linkCheckoutShopee} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-orange-700 underline">
                Checkout di Shopee →
              </a>
            )}
          </div>
          <FileUploadField
            name="buktiShopee"
            label="Bukti checkout Shopee"
            hint="Tidak perlu nomor transaksi — cukup screenshot/bukti checkout. JPG, PNG, WEBP, atau PDF (maks 5MB)."
            required
          />
        </div>
      )}

      {selected.size > 0 && (
        <div className="rounded-xl bg-cream-soft px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-sand-600">Sisa pelunasan produk dipilih</span>
            <span className="text-lg font-extrabold text-sand-900">{formatRupiah(activePreview.dueTotal)}</span>
          </div>
          {includeShopee && (
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-sand-200 pt-1 text-xs text-sand-500">
              <span>Via Shopee: {formatRupiah(shopeeAmount)}</span>
              <span>Via {gateway ? "gateway" : "transfer"}: {formatRupiah(bankAmount)}</span>
            </div>
          )}
        </div>
      )}

      {!gateway && bankAmount > 0 && (
        <FileUploadField name="bukti" label="Bukti transfer" hint="JPG, PNG, WEBP, atau PDF (maks 5MB)." required />
      )}
      {gateway && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
          Anda akan diarahkan ke halaman pembayaran (QRIS / Virtual Account / e-wallet / kartu).
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || selected.size === 0 || (gateway ? !gatewayAvailable : !manualAccountReady)}
      >
        {pending ? "Mengirim…" : "Kirim pelunasan"}
      </Button>
    </form>
  );
}
