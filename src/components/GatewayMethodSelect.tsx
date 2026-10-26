"use client";

import { useEffect, useId, useState } from "react";
import { Select } from "@/components/ui";
import { formatRupiah } from "@/lib/format";

type GatewayMethod = { code: string; name: string; fee?: number };

export function GatewayMethodSelect({
  amount,
  enabled,
}: {
  amount: number;
  enabled: boolean;
}) {
  const [result, setResult] = useState<{
    amount: number;
    methods: GatewayMethod[];
    error: string;
  } | null>(null);
  const [selected, setSelected] = useState("");
  const selectId = useId();

  useEffect(() => {
    if (!enabled || amount < 100) return;
    const controller = new AbortController();
    fetch(`/api/payment-methods?amount=${amount}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Pilihan pembayaran belum dapat dimuat.");
        return response.json() as Promise<GatewayMethod[]>;
      })
      .then((available) => {
        setResult({ amount, methods: available, error: "" });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          amount,
          methods: [],
          error: reason instanceof Error ? reason.message : "Pilihan pembayaran belum dapat dimuat.",
        });
      });
    return () => controller.abort();
  }, [amount, enabled]);

  if (!enabled) return null;
  const current = result?.amount === amount ? result : null;
  const methods = current?.methods ?? [];
  const error = amount < 100 ? "Nominal pembayaran belum memenuhi minimum." : current?.error ?? "";
  const loading = amount >= 100 && !current;
  const value = methods.some((method) => method.code === selected)
    ? selected
    : methods[0]?.code ?? "";
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-bold">
        Pilih QRIS atau bank Virtual Account
      </label>
      <Select
        id={selectId}
        name="paymentMethodCode"
        value={value}
        onChange={(event) => setSelected(event.target.value)}
        required
        className="min-h-11 w-full text-sm"
        aria-describedby={error ? `${selectId}-error` : undefined}
      >
        <option value="">{loading ? "Memuat pilihan..." : "Pilih metode pembayaran"}</option>
        {methods.map((method) => (
          <option key={method.code} value={method.code}>
            {method.name}{method.fee ? ` (+${formatRupiah(method.fee)})` : ""}
          </option>
        ))}
      </Select>
      {error && <p id={`${selectId}-error`} role="alert" className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
