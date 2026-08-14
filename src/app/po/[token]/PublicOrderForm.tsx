"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, FormError, Input, ScrollList } from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { formatRupiah } from "@/lib/format";
import { createPublicOrder } from "../actions";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "../constants";

export type PublicVariantOption = {
  id: string;
  namaVarian: string;
  sisa: number;
  harga: number;
  gambarUrl?: string | null;
  images?: string[];
  warna?: string[];
};

export function PublicOrderForm({
  formToken,
  variants,
}: {
  formToken: string;
  variants: PublicVariantOption[];
}) {
  const action = createPublicOrder.bind(null, formToken);
  const [state, formAction, pending] = useActionState<
    PublicOrderState,
    FormData
  >(action, undefined);

  // Semua input dikontrol lewat React state supaya isinya tidak hilang saat form
  // dirender ulang setelah error/konfirmasi. Kita juga submit lewat onSubmit
  // (bukan `action={formAction}`) agar React 19 tidak otomatis mereset field —
  // ini yang sebelumnya membuat keranjang jadi kosong ("Pilih minimal satu varian")
  // dan bukti pembayaran hilang saat konfirmasi duplikat.
  const [namaPembeli, setNamaPembeli] = useState("");
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [jumlahBayar, setJumlahBayar] = useState(""); // hanya digit

  // Keranjang: qty per varian (0 = tidak dipesan).
  const [qty, setQty] = useState<Record<string, number>>({});
  const setQ = (id: string, v: number) =>
    setQty((s) => ({ ...s, [id]: Math.max(0, v) }));
  // Warna terpilih per varian.
  const [warnaSel, setWarnaSel] = useState<Record<string, string>>({});

  const items = variants
    .filter((v) => (qty[v.id] ?? 0) > 0)
    .map((v) => ({
      variantId: v.id,
      jumlah: qty[v.id] ?? 0,
      warna: warnaSel[v.id] || undefined,
    }));
  const total = variants.reduce((s, v) => s + v.harga * (qty[v.id] ?? 0), 0);
  const adaItem = items.length > 0;
  // Ada varian dipesan yang punya opsi warna tapi belum dipilih → blokir.
  const warnaBelumLengkap = variants.some(
    (v) =>
      (qty[v.id] ?? 0) > 0 &&
      v.warna &&
      v.warna.length > 0 &&
      !warnaSel[v.id],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Bangun FormData dari DOM (menangkap file bukti), lalu timpa keranjang &
    // jumlah bayar dari state agar selalu konsisten.
    const fd = new FormData(e.currentTarget);
    fd.set("cart", JSON.stringify(items));
    fd.set("jumlahBayar", jumlahBayar);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state?.error && <FormError message={state.error} />}
      {state?.needsConfirm && state.warning && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          {state.warning}
        </div>
      )}
      {state?.needsConfirm && (
        <input type="hidden" name="confirmDuplikat" value="1" />
      )}

      <Field label="Nama" required>
        <Input
          name="namaPembeli"
          required
          value={namaPembeli}
          onChange={(e) => setNamaPembeli(e.target.value)}
          placeholder="Nama lengkap Anda"
        />
      </Field>
      <Field label="WhatsApp" required>
        <Input
          name="wa"
          required
          value={wa}
          onChange={(e) => setWa(e.target.value)}
          placeholder="081234567890"
        />
      </Field>
      <Field label="Email" required>
        <Input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />
      </Field>

      {/* Keranjang varian (FR-3.1/3.1a) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Pilih varian</p>
        <ScrollList maxRows={5} rowHeight={4.75} className="space-y-2 pr-1">
        {variants.map((v) => {
          const habis = v.sisa <= 0;
          const q = qty[v.id] ?? 0;
          return (
            <div
              key={v.id}
              className={`rounded-lg border p-3 ${
                habis ? "border-slate-100 opacity-60" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {v.gambarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.gambarUrl}
                    alt={v.namaVarian}
                    className="h-12 w-12 rounded object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {v.namaVarian}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRupiah(v.harga)} · sisa {Math.max(0, v.sisa)}
                  </p>
                </div>
                {habis ? (
                  <span className="text-xs font-medium text-rose-600">Habis</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQ(v.id, q - 1)}
                      className="h-7 w-7 rounded bg-slate-100 text-slate-700"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{q}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQ(v.id, Math.min(v.sisa, MAX_UNIT_PER_SUBMISSION, q + 1))
                      }
                      className="h-7 w-7 rounded bg-slate-100 text-slate-700"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Galeri referensi (multi-image) */}
              {v.images && v.images.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                  {v.images.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${src}-${idx}`}
                      src={src}
                      alt={`${v.namaVarian} ${idx + 1}`}
                      className="h-12 w-12 shrink-0 rounded object-cover ring-1 ring-slate-200"
                    />
                  ))}
                </div>
              )}

              {/* Pilihan warna (wajib bila ada opsi) */}
              {!habis && v.warna && v.warna.length > 0 && (
                <div className="mt-2">
                  <select
                    value={warnaSel[v.id] ?? ""}
                    onChange={(e) =>
                      setWarnaSel((s) => ({ ...s, [v.id]: e.target.value }))
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      (qty[v.id] ?? 0) > 0 && !warnaSel[v.id]
                        ? "border-rose-300"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">— pilih warna —</option>
                    {v.warna.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
        </ScrollList>
      </div>

      {/* Bukti pembayaran (wajib) */}
      <FileUploadField
        name="buktiPembayaran"
        label="Bukti pembayaran"
        hint="Unggah bukti transfer — JPG, PNG, WEBP, atau PDF (maks 5MB)."
        required
      />

      {/* Jumlah yang dibayarkan */}
      <Field
        label="Jumlah yang dibayarkan"
        required
        hint={
          jumlahBayar
            ? `= ${formatRupiah(Number(jumlahBayar))}`
            : "Nominal transfer sesuai bukti pembayaran."
        }
      >
        <Input
          name="jumlahBayar"
          inputMode="numeric"
          required
          value={jumlahBayar}
          onChange={(e) => setJumlahBayar(e.target.value.replace(/\D/g, ""))}
          placeholder="150000"
        />
      </Field>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-lg font-semibold text-slate-900">
          {formatRupiah(total)}
        </span>
      </div>

      {warnaBelumLengkap && (
        <p className="text-center text-xs text-rose-600">
          Pilih warna untuk varian yang dipesan.
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={pending || !adaItem || warnaBelumLengkap}
      >
        {pending
          ? "Mengirim…"
          : state?.needsConfirm
            ? "Ya, kirim tetap"
            : "Kirim Pesanan"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Maksimal {MAX_UNIT_PER_SUBMISSION} unit per varian.
      </p>
    </form>
  );
}
