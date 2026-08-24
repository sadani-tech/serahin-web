"use client";

import { useActionState, useState } from "react";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";
import {
  Button,
  Card,
  EmptyState,
  Field,
  FormError,
  Input,
  ScrollList,
  Textarea,
} from "@/components/ui";
import { FileUploadField } from "@/components/FileUploadField";
import { CurrencyInput } from "@/components/CurrencyInput";
import { VariantPickerModal } from "@/components/VariantPickerModal";
import { formatRupiah } from "@/lib/format";
import type { OrderFormState } from "./actions";

export type VariantOption = {
  id: string;
  namaVarian: string;
  sisa: number; // sisa kuota
  harga: number;
  warna?: string[]; // opsi warna (bila ada)
};

type Row = { variantId: string; jumlah: number; warna?: string };

/** Pisahkan kontak gabungan "wa, email" menjadi field terpisah. */
function splitKontak(kontak?: string): { wa: string; email: string } {
  const parts = (kontak ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = parts.find((p) => p.includes("@")) ?? "";
  const wa = parts.find((p) => !p.includes("@")) ?? "";
  return { wa, email };
}

export function OrderForm({
  action,
  variants,
  initial,
  submitLabel,
  withBuktiPembayaran = false,
}: {
  action: (
    prev: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  variants: VariantOption[];
  initial?: {
    namaPembeli?: string;
    kontak?: string;
    catatan?: string;
    items?: Row[];
  };
  submitLabel: string;
  /** Tampilkan field unggah bukti pembayaran (hanya saat buat pesanan baru). */
  withBuktiPembayaran?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  useOverlayWhilePending(pending);

  const { wa: initialWa, email: initialEmail } = splitKontak(initial?.kontak);

  const [cart, setCart] = useState<Row[]>(
    initial?.items?.filter((it) => it.variantId) ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const varById = new Map(variants.map((v) => [v.id, v]));
  const inCart = new Set(cart.map((r) => r.variantId));

  const addToCart = (variantId: string) =>
    setCart((c) =>
      c.some((r) => r.variantId === variantId)
        ? c
        : [...c, { variantId, jumlah: 1 }],
    );
  const setQty = (variantId: string, jumlah: number) =>
    setCart((c) =>
      c.map((r) =>
        r.variantId === variantId ? { ...r, jumlah: Math.max(1, jumlah) } : r,
      ),
    );
  const removeItem = (variantId: string) =>
    setCart((c) => c.filter((r) => r.variantId !== variantId));
  const setWarna = (variantId: string, warna: string) =>
    setCart((c) =>
      c.map((r) => (r.variantId === variantId ? { ...r, warna } : r)),
    );

  const total = cart.reduce((s, r) => {
    const v = varById.get(r.variantId);
    return s + (v ? v.harga * r.jumlah : 0);
  }, 0);

  // Ada item berwarna yang belum memilih warna → blokir simpan.
  const warnaBelumLengkap = cart.some((r) => {
    const v = varById.get(r.variantId);
    return v?.warna && v.warna.length > 0 && !r.warna;
  });

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama pembeli" required>
            <Input
              name="namaPembeli"
              defaultValue={initial?.namaPembeli}
              placeholder="Nama lengkap"
              required
            />
          </Field>
          <Field label="WhatsApp" required>
            <Input
              name="wa"
              defaultValue={initialWa}
              placeholder="081234567890"
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              defaultValue={initialEmail}
              required
              placeholder="email@example.com"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan">
              <Textarea
                name="catatan"
                rows={2}
                defaultValue={initial?.catatan}
                placeholder="Catatan tambahan (opsional)"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-sand-900">
            Item pesanan (keranjang)
          </h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPickerOpen(true)}
          >
            + Tambah item
          </Button>
        </div>

        {cart.length === 0 ? (
          <EmptyState
            title="Keranjang masih kosong"
            description="Klik “Tambah item” untuk memilih varian produk."
            action={
              <Button type="button" onClick={() => setPickerOpen(true)}>
                + Tambah item
              </Button>
            }
          />
        ) : (
          <ScrollList maxRows={6} rowHeight={4.5} className="space-y-2 pr-1">
            {cart.map((r) => {
              const v = varById.get(r.variantId);
              const maxQty = v ? Math.max(1, v.sisa) : undefined;
              const atMax = maxQty !== undefined && r.jumlah >= maxQty;
              return (
                <div
                  key={r.variantId}
                  className="flex items-center gap-3 rounded-lg border border-sand-200 p-3"
                >
                  <input type="hidden" name="itemVariantId" value={r.variantId} />
                  <input type="hidden" name="itemJumlah" value={r.jumlah} />
                  <input type="hidden" name="itemWarna" value={r.warna ?? ""} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sand-900">
                      {v ? v.namaVarian : "Varian tidak tersedia"}
                    </p>
                    <p className="text-xs text-sand-500">
                      {v ? formatRupiah(v.harga) : "—"}
                      {v ? ` · sisa ${Math.max(0, v.sisa)}` : ""}
                    </p>
                    {v?.warna && v.warna.length > 0 && (
                      <select
                        value={r.warna ?? ""}
                        onChange={(e) => setWarna(r.variantId, e.target.value)}
                        className={`mt-1.5 rounded-lg border px-2 py-1 text-xs ${
                          r.warna ? "border-sand-300" : "border-rose-300"
                        }`}
                      >
                        <option value="">— pilih warna —</option>
                        {v.warna.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(r.variantId, r.jumlah - 1)}
                      disabled={r.jumlah <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-sand-100 text-sand-700 hover:bg-sand-200 disabled:opacity-40"
                      aria-label="Kurangi"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {r.jumlah}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(r.variantId, r.jumlah + 1)}
                      disabled={atMax}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-sand-100 text-sand-700 hover:bg-sand-200 disabled:opacity-40"
                      aria-label="Tambah"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-28 text-right text-sm font-medium text-sand-900">
                    {v ? formatRupiah(v.harga * r.jumlah) : "—"}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(r.variantId)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sand-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Hapus item"
                    title="Hapus item"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </ScrollList>
        )}

        <div className="mt-4 flex justify-between border-t border-sand-100 pt-3 text-sm">
          <span className="text-sand-500">
            {cart.length} item · {cart.reduce((s, r) => s + r.jumlah, 0)} unit
          </span>
          <span className="font-medium text-sand-900">
            Total: {formatRupiah(total)}
          </span>
        </div>
      </Card>

      {withBuktiPembayaran && (
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-sand-900">
            Pembayaran awal
          </h3>
          <p className="mb-4 text-xs text-sand-500">
            Catat nominal yang sudah dibayar beserta buktinya. Pembayaran akan
            berstatus menunggu verifikasi.
          </p>
          <div className="space-y-4">
            <Field
              label="Jumlah dibayar (Rp)"
              required
              hint={`Total pesanan: ${formatRupiah(total)}`}
            >
              <CurrencyInput name="jumlahBayar" required placeholder="0" />
            </Field>
            <FileUploadField
              name="buktiPembayaran"
              label="Unggah bukti pembayaran"
              hint="JPG, PNG, WEBP, atau PDF (maks 5MB)."
              required
            />
          </div>
        </Card>
      )}

      <div className="flex flex-col items-end gap-1">
        {warnaBelumLengkap && (
          <p className="text-xs text-rose-600">
            Pilih warna untuk item yang memerlukannya.
          </p>
        )}
        <Button
          type="submit"
          disabled={pending || cart.length === 0 || warnaBelumLengkap}
        >
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>

      <VariantPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        variants={variants}
        inCart={inCart}
        onPick={addToCart}
      />
    </form>
  );
}
