"use client";

import { useState } from "react";
import { Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ORDER_PROGRESS_LABEL, ORDER_PROGRESS_OPTIONS } from "@/lib/domain";
import { OrderProgressStatus } from "@/lib/types";
import { changeOrderProgress } from "../actions";

export function OrderStatusControl({
  orderId,
  current,
  isCustom,
}: {
  orderId: string;
  current: OrderProgressStatus;
  isCustom: boolean;
}) {
  const [target, setTarget] = useState<OrderProgressStatus | "INHERIT">(isCustom ? current : "INHERIT");
  const changed = target !== (isCustom ? current : "INHERIT");
  const action = changeOrderProgress.bind(null, orderId);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-sand-700">
          Status progres pesanan
        </label>
        <Select
          name="progressStatus"
          value={target}
          onChange={(e) => setTarget(e.target.value as OrderProgressStatus | "INHERIT")}
        >
          <option value="INHERIT">Ikuti milestone Batch PO</option>
          {ORDER_PROGRESS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_PROGRESS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-sand-500">
        Status pembayaran tidak berubah saat progres pesanan diedit.
      </p>
      <SubmitButton disabled={!changed} loadingText="Menyimpan…" className="w-full">
        Simpan status
      </SubmitButton>
    </form>
  );
}
