"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requestCancellation } from "./actions";

export function CancelRequestForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const action = requestCancellation.bind(null, orderId);
  const [state, formAction] = useActionState(action, undefined);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        Ajukan Pembatalan
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-sand-950/25 px-4 py-8 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Tutup dialog pembatalan" onClick={() => setOpen(false)} />
          <section className="relative w-full max-w-md rounded-[1.75rem] border border-sand-200 bg-white p-6 shadow-2xl sm:p-7">
            <h2 id="cancel-order-title" className="text-lg font-extrabold text-sand-900">
              Yakin ingin membatalkan pesanan ini?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-sand-600">
              Pembatalan menunggu persetujuan Seller. Pengembalian dana (bila sudah ada pembayaran) dilakukan manual oleh Seller setelah disetujui.
            </p>
            <form action={formAction} className="mt-4 space-y-3">
              {state?.error && <FormError message={state.error} />}
              <Textarea
                name="alasan"
                rows={3}
                required
                autoFocus
                placeholder="Alasan pembatalan — mis. salah pesan varian"
              />
              <div className="flex gap-2">
                <SubmitButton variant="danger" loadingText="Mengajukan…" className="flex-1">
                  Ya, Batalkan Pesanan
                </SubmitButton>
                <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                  Kembali
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
