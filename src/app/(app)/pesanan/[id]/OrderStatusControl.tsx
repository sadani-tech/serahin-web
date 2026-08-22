"use client";

import { useState } from "react";
import { Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from "@/lib/domain";
import { OrderStatus } from "@/lib/types";
import { changeOrderStatus } from "../actions";

export function OrderStatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [target, setTarget] = useState<OrderStatus>(current);
  const changed = target !== current;
  const action = changeOrderStatus.bind(null, orderId);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-sand-700">
          Ubah status pesanan
        </label>
        <Select
          name="status"
          value={target}
          onChange={(e) => setTarget(e.target.value as OrderStatus)}
        >
          {ORDER_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      {changed && (
        <Textarea name="catatan" rows={2} placeholder="Catatan (opsional)" />
      )}
      <SubmitButton disabled={!changed} loadingText="Menyimpan…" className="w-full">
        Simpan status
      </SubmitButton>
    </form>
  );
}
