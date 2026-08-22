"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useConfirm } from "@/components/ConfirmDialog";
import { PAYMENT_TYPE_LABEL, METODE_PENGIRIMAN_LABEL } from "@/lib/domain";
import { PaymentScheme, MetodePengiriman } from "@/lib/types";
import { addPayment, type PaymentFormState } from "../actions";

export function PaymentForm({
  orderId,
  scheme,
  sisaDp,
  sisaTotal,
}: {
  orderId: string;
  scheme: PaymentScheme;
  sisaDp: number;
  sisaTotal: number;
}) {
  const action = addPayment.bind(null, orderId);
  const [state, formAction, pending] = useActionState<
    PaymentFormState,
    FormData
  >(action, undefined);
  useOverlayWhilePending(pending);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const defaultJenis = scheme === "LUNAS" ? "LUNAS" : "DP";
  const [jenis, setJenis] = useState<string>(defaultJenis);
  const [metode, setMetode] = useState<MetodePengiriman | "">("");
  const [alamat, setAlamat] = useState("");
  const { alert } = useConfirm();

  // Reset form setelah sukses (state kembali undefined tanpa error).
  useEffect(() => {
    if (state === undefined) {
      formRef.current?.reset();
      setPreview(null);
      setFileName("");
      setJenis(defaultJenis);
      setMetode("");
      setAlamat("");
    }
  }, [state, defaultJenis]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        void alert({
          title: "File terlalu besar",
          description: "Ukuran file melebihi batas maksimal 5MB.",
        });
        e.target.value = "";
        setPreview(null);
        setFileName("");
        return;
      }
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
      setFileName("");
    }
  };

  const jenisOptions =
    scheme === "LUNAS"
      ? (["LUNAS"] as const)
      : (["DP", "PELUNASAN"] as const);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state?.error && <FormError message={state.error} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Jenis" required>
          <Select
            name="jenis"
            required
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
          >
            {jenisOptions.map((j) => (
              <option key={j} value={j}>
                {PAYMENT_TYPE_LABEL[j]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Jumlah (Rp)"
          required
          hint={
            scheme === "DP_PELUNASAN"
              ? `Saran DP: Rp${sisaDp.toLocaleString("id-ID")} · Sisa total: Rp${sisaTotal.toLocaleString("id-ID")}`
              : `Sisa total: Rp${sisaTotal.toLocaleString("id-ID")}`
          }
        >
          <CurrencyInput name="jumlah" required placeholder="0" />
        </Field>
        <Field label="Tanggal bayar">
          <Input name="tanggal" type="date" />
        </Field>
        <Field label="Bukti transfer" required hint="JPG, PNG, WEBP, atau PDF (maks 5MB)">
          <Input
            name="bukti"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            required
            className="file:mr-3 file:rounded-md file:border-0 file:bg-sand-100 file:px-3 file:py-1 file:text-sm"
          />
          {preview ? (
            <div className="mt-2 space-y-1">
              {!fileName.toLowerCase().endsWith(".pdf") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Pratinjau bukti"
                  className="max-h-48 rounded-lg border border-sand-200"
                />
              ) : (
                <div className="rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-700">
                  📄 {fileName}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFileName("");
                  const fileInput = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
                  if (fileInput) fileInput.value = "";
                }}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                Hapus
              </button>
            </div>
          ) : null}
        </Field>
      </div>

      {jenis === "PELUNASAN" && (
        <div className="space-y-3 rounded-lg bg-sand-50 p-3 ring-1 ring-inset ring-sand-200">
          <Field
            label="Metode pengiriman"
            required
            hint="Sama seperti portal pembeli: Checkout Shopee atau Manual by Ekspedisi."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(METODE_PENGIRIMAN_LABEL) as MetodePengiriman[]).map(
                (opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      metode === opt
                        ? "border-brand-500 bg-white ring-1 ring-brand-500"
                        : "border-sand-200 bg-white hover:border-sand-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodePengiriman"
                      value={opt}
                      checked={metode === opt}
                      onChange={() => setMetode(opt)}
                      required
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

          {metode === "EKSPEDISI" && (
            <Field
              label="Alamat pengiriman lengkap"
              required
              hint="Nama, Nomor HP, dan alamat lengkap untuk pengiriman ekspedisi."
            >
              <Textarea
                name="alamatPengiriman"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={3}
                required
                placeholder="Nama · No HP · Alamat lengkap (jalan, kecamatan, kota, kode pos)"
              />
            </Field>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Catat pembayaran"}
        </Button>
      </div>
    </form>
  );
}
