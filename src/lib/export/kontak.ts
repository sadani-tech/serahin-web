import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/domain";
import { OrderFilters, orderWhere } from "./query";

/** Kolom tambahan opsional untuk ekspor kontak (v1.6 4.3). */
export type KontakExtraColumn = "kampanye" | "status" | "tanggal";

/**
 * Baris ekspor kontak (v1.6 4.3) — hanya nama & kontak secara default;
 * kolom tambahan bersifat opt-in. Duplikat kontak digabung.
 */
export async function buildKontakRows(
  f: OrderFilters,
  extras: KontakExtraColumn[],
) {
  const orders = await prisma.order.findMany({
    where: orderWhere(f),
    orderBy: { createdAt: "asc" },
    select: {
      namaPembeli: true,
      kontak: true,
      status: true,
      createdAt: true,
      campaign: { select: { namaProduk: true } },
    },
  });

  const withExtras = extras.length > 0;
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const o of orders) {
    // Tanpa kolom tambahan, gabungkan kontak duplikat (nama+kontak sama).
    if (!withExtras) {
      const key = `${o.namaPembeli}|${o.kontak}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    const row: Record<string, unknown> = {
      Nama: o.namaPembeli,
      Kontak: o.kontak,
    };
    if (extras.includes("kampanye")) row.Kampanye = o.campaign.namaProduk;
    if (extras.includes("status")) row.Status = ORDER_STATUS_LABEL[o.status];
    if (extras.includes("tanggal"))
      row.Tanggal = o.createdAt.toISOString().slice(0, 10);
    rows.push(row);
  }
  return rows;
}
