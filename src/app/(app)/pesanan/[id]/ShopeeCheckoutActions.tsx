"use client";

import { useActionState, useState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FormError, Select } from "@/components/ui";
import { reviewShopeeCheckout, type ShopeeReviewState } from "../actions";

export function ShopeeCheckoutActions({
  orderId,
  creditId,
  submittedAmount,
}: {
  orderId: string;
  creditId: string;
  submittedAmount: string;
}) {
  const action = reviewShopeeCheckout.bind(null, orderId, creditId);
  const [state, formAction, pending] = useActionState<ShopeeReviewState, FormData>(action, undefined);
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  return <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm sm:grid-cols-3">
    {state?.error && <div className="sm:col-span-3"><FormError message={state.error} /></div>}
    <Select name="keputusan" value={decision} onChange={(event) => setDecision(event.target.value as "VERIFIED" | "REJECTED")} className="min-h-10 !border-orange-300 font-semibold">
      <option value="VERIFIED">Verifikasi</option>
      <option value="REJECTED">Tolak</option>
    </Select>
    {decision === "VERIFIED" ? <CurrencyInput name="jumlah" defaultValue={submittedAmount} className="min-h-10 border-orange-300 bg-white" /> : <input name="alasan" required placeholder="Alasan penolakan" className="min-h-10 rounded-lg border border-orange-300 bg-white px-2" />}
    <button disabled={pending} className="min-h-10 rounded-lg bg-orange-600 px-3 font-extrabold text-white disabled:opacity-60">{pending ? "Menyimpan…" : decision === "VERIFIED" ? "Verifikasi" : "Tolak"}</button>
  </form>;
}
