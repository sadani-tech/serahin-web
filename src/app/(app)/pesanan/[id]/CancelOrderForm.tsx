"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/ui";
import { cancelOrder } from "../actions";

export function CancelOrderForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const action = cancelOrder.bind(null, orderId);

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)} className="w-full">
        Batalkan pesanan
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <Textarea
        name="alasanBatal"
        rows={2}
        required
        placeholder="Alasan pembatalan — mis. pembeli tidak melunasi"
      />
      <div className="flex gap-2">
        <Button variant="danger" type="submit" className="flex-1">
          Konfirmasi batal
        </Button>
        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
