"use client";

import { useActionState, useState } from "react";
import { Button, FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requestCancellation } from "./actions";

export function CancelRequestForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const action = requestCancellation.bind(null, orderId);
  const [state, formAction] = useActionState(action, undefined);

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        Ajukan Pembatalan
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {state?.error && <FormError message={state.error} />}
      <Textarea
        name="alasan"
        rows={2}
        required
        placeholder="Alasan pembatalan — mis. salah pesan varian"
      />
      <p className="text-xs text-sand-500">
        Pembatalan menunggu persetujuan Seller. Pengembalian dana (bila sudah ada pembayaran) dilakukan manual oleh Seller setelah disetujui.
      </p>
      <div className="flex gap-2">
        <SubmitButton variant="danger" loadingText="Mengajukan…" className="flex-1 sm:flex-none">
          Kirim Pengajuan
        </SubmitButton>
        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
