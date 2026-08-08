import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { Prisma } from "@/generated/prisma";

type DB = typeof prisma | Prisma.TransactionClient;

/**
 * Kuota terisi per varian (v1.5): dijumlahkan dari OrderItem milik pesanan
 * yang masih aktif (bukan DIBATALKAN/DITOLAK).
 */
export async function terisiForVariants(
  client: DB,
  variantIds: string[],
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await client.orderItem.groupBy({
    by: ["variantId"],
    where: {
      variantId: { in: variantIds },
      order: { status: { notIn: ORDER_STATUS_NONAKTIF } },
    },
    _sum: { jumlah: true },
  });
  return new Map(rows.map((r) => [r.variantId, r._sum.jumlah ?? 0]));
}

/** Terisi untuk satu varian, opsional mengecualikan satu pesanan. */
export async function terisiOneVariant(
  client: DB,
  variantId: string,
  excludeOrderId?: string,
): Promise<number> {
  const agg = await client.orderItem.aggregate({
    where: {
      variantId,
      order: {
        status: { notIn: ORDER_STATUS_NONAKTIF },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
    },
    _sum: { jumlah: true },
  });
  return agg._sum.jumlah ?? 0;
}
