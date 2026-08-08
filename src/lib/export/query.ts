import { OrderStatus, PaymentVerification, Prisma } from "@/generated/prisma";

export type OrderFilters = {
  campaignId?: string; // kosong = gabungan semua kampanye (4.1)
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus;
  verifikasi?: PaymentVerification;
};

/** Parse filter umum dari query string ekspor. */
export function parseFilters(sp: URLSearchParams): OrderFilters {
  const f: OrderFilters = {};
  const campaign = sp.get("campaign");
  if (campaign) f.campaignId = campaign;

  const from = sp.get("from");
  if (from) f.dateFrom = new Date(from);

  const to = sp.get("to");
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    f.dateTo = d;
  }

  const status = sp.get("status");
  if (status && status in OrderStatus) f.status = status as OrderStatus;

  const verifikasi = sp.get("verifikasi");
  if (verifikasi && verifikasi in PaymentVerification) {
    f.verifikasi = verifikasi as PaymentVerification;
  }

  return f;
}

/** Susun where Prisma untuk Order dari filter (kampanye, tanggal, status). */
export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (f.campaignId) where.campaignId = f.campaignId;
  if (f.status) where.status = f.status;
  if (f.dateFrom || f.dateTo) {
    where.createdAt = {};
    if (f.dateFrom) where.createdAt.gte = f.dateFrom;
    if (f.dateTo) where.createdAt.lte = f.dateTo;
  }
  return where;
}

/** Ringkasan filter untuk audit & keterangan file (v1.6 4.3/4.4). */
export function describeFilters(
  f: OrderFilters,
  campaignName?: string | null,
): string {
  const parts: string[] = [];
  parts.push(f.campaignId ? `Kampanye: ${campaignName ?? f.campaignId}` : "Semua kampanye");
  if (f.status) parts.push(`Status: ${f.status}`);
  if (f.verifikasi) parts.push(`Verifikasi: ${f.verifikasi}`);
  if (f.dateFrom) parts.push(`Dari: ${f.dateFrom.toISOString().slice(0, 10)}`);
  if (f.dateTo) parts.push(`Sampai: ${f.dateTo.toISOString().slice(0, 10)}`);
  return parts.join(" · ");
}
