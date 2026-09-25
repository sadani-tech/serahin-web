import { PaymentScheme, PaymentVerification } from "@/lib/types";
import { toNumber } from "@/lib/format";

export type Billing = {
  total: number; // SUM(hargaSaatPesan × jumlah) seluruh item (FR-2.3/2.4)
  dibayar: number; // total pembayaran TERVERIFIKASI
  menungguVerifikasi: number; // total pembayaran menunggu verifikasi
  sisa: number; // total - dibayar (tidak negatif)
  lunas: boolean;
  dpTarget: number; // nominal DP yang diharapkan (0 bila skema LUNAS)
};

export type BillingItem = {
  hargaSaatPesan: number | string;
  jumlah: number;
  /**
   * DP kustom per Produk/Varian (v2.3.7 §3.18) — bila terisi, dipakai apa
   * adanya untuk baris ini, mengesampingkan dpTipe/dpPercent/dpNominal level
   * Batch PO yang diteruskan terpisah ke computeDownPaymentTarget/
   * computeBilling. Bila kosong, baris ini mengikuti nilai Batch PO tersebut.
   */
  dpTipe?: "PERSEN" | "NOMINAL" | null;
  dpPercent?: number | null;
  dpNominal?: number | string | null;
};

/** Total nilai pesanan dari seluruh item (price snapshot). */
export function computeOrderTotal(items: BillingItem[]): number {
  return items.reduce(
    (s, it) => s + toNumber(it.hargaSaatPesan) * it.jumlah,
    0,
  );
}

/** Total jumlah unit seluruh item dalam pesanan. */
export function computeOrderQty(items: { jumlah: number }[]): number {
  return items.reduce((s, it) => s + it.jumlah, 0);
}

/**
 * DP nominal maupun persen dihitung untuk setiap unit produk.
 *
 * DP kustom per Produk/Varian (v2.3.7 §3.18): tiap baris `items` boleh
 * membawa `dpTipe`/`dpPercent`/`dpNominal` sendiri (override Produk). Baris
 * tanpa itu jatuh ke `dpTipe`/`dpPercent`/`dpNominal` Batch PO (parameter
 * fungsi ini) — perilaku identik dengan sebelum v2.3.7.
 */
export function computeDownPaymentTarget(
  items: BillingItem[],
  dpTipe: "PERSEN" | "NOMINAL" | null | undefined,
  dpPercent?: number | null,
  dpNominal?: number | string | null,
): number {
  const total = computeOrderTotal(items);
  if (total <= 0) return 0;

  const target = items.reduce((sum, item) => {
    const effectiveTipe = item.dpTipe ?? dpTipe;
    const effectivePercent = item.dpTipe ? item.dpPercent : dpPercent;
    const effectiveNominal = item.dpTipe ? item.dpNominal : dpNominal;
    const unitPrice = Math.max(0, toNumber(item.hargaSaatPesan));
    if (effectiveTipe === "NOMINAL") {
      const unitDp = Math.max(0, toNumber(effectiveNominal ?? 0));
      // Produk yang harganya di bawah DP nominal tetap otomatis jatuh ke DP
      // 50% dari harga produk itu sendiri (v2.3.7 §3.20).
      const perUnitDp = unitPrice < unitDp
        ? Math.round(unitPrice * 0.5)
        : Math.min(unitPrice, unitDp);
      return sum + perUnitDp * item.jumlah;
    }
    const percent = Math.min(100, Math.max(0, effectivePercent ?? 50));
    return sum + Math.round((unitPrice * percent) / 100) * item.jumlah;
  }, 0);

  return Math.min(total, Math.round(target));
}

/**
 * Ringkasan tagihan sebuah pesanan (FR-3.5 v1.0, diperbarui v1.5 FR-2.4).
 * Total dihitung dari item (price snapshot); hanya pembayaran TERVERIFIKASI
 * yang mengurangi sisa tagihan.
 */
export function computeBilling(params: {
  items: BillingItem[];
  paymentScheme: PaymentScheme;
  /** PERSEN (dpPercent) atau NOMINAL (dpNominal). Default PERSEN. */
  dpTipe?: "PERSEN" | "NOMINAL" | null;
  dpPercent?: number | null;
  dpNominal?: number | string | null;
  payments: { jumlah: number | string; statusVerifikasi: PaymentVerification }[];
}): Billing {
  const total = computeOrderTotal(params.items);

  let dibayar = 0;
  let menungguVerifikasi = 0;
  for (const p of params.payments) {
    const nilai = toNumber(p.jumlah);
    if (p.statusVerifikasi === "TERVERIFIKASI") dibayar += nilai;
    else if (p.statusVerifikasi === "MENUNGGU_VERIFIKASI")
      menungguVerifikasi += nilai;
  }

  const sisa = Math.max(total - dibayar, 0);
  const dpTarget =
    params.paymentScheme === "DP_PELUNASAN"
      ? computeDownPaymentTarget(
          params.items,
          params.dpTipe,
          params.dpPercent,
          params.dpNominal,
        )
      : 0;

  return {
    total,
    dibayar,
    menungguVerifikasi,
    sisa,
    lunas: dibayar >= total && total > 0,
    dpTarget,
  };
}
