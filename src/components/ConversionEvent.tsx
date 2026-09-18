"use client";

import { useEffect } from "react";

type ConversionName = "order_submitted" | "payment_paid" | "payment_pending" | "payment_failed";

/**
 * Event konversi privacy-safe. Payload sengaja hanya berisi agregat transaksi;
 * jangan menambahkan token, order/payment ID, email, telepon, atau alamat.
 */
export function ConversionEvent({ name, value, itemCount }: { name: ConversionName; value?: number; itemCount?: number }) {
  useEffect(() => {
    const detail = {
      event: name,
      ...(typeof value === "number" ? { value: Math.round(value), currency: "IDR" } : {}),
      ...(typeof itemCount === "number" ? { itemCount } : {}),
    };
    const target = window as Window & { dataLayer?: Array<Record<string, unknown>> };
    target.dataLayer?.push(detail);
    window.dispatchEvent(new CustomEvent("serahin:conversion", { detail }));
  }, [itemCount, name, value]);
  return null;
}
