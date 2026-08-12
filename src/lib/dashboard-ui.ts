/**
 * Konstanta & helper murni untuk tampilan dashboard — TIDAK boleh mengimpor
 * apa pun dari `@/lib/api` (yang memakai `next/headers`, server-only).
 * File ini aman diimpor dari komponen client (mis. DashboardSection.tsx).
 */

export const NEAR_DEADLINE_DAYS = 7;
export const STALE_TIMELINE_DAYS = 7;

export function persenKuotaColor(persen: number): string {
  if (persen >= 100) return "bg-rose-500";
  if (persen >= 75) return "bg-amber-500";
  return "bg-slate-900";
}
