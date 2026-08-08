"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saveBuktiFile } from "@/lib/upload";
import { generateAccessToken } from "@/lib/token";
import { campaignMenerimaPesanan } from "@/lib/domain";
import { terisiOneVariant } from "@/lib/quota";
import { OrderStatus, PaymentType, Prisma } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Pesanan (Modul 4.2) — v1.5: multi-varian (keranjang)
// ---------------------------------------------------------------------------

const headerSchema = z.object({
  namaPembeli: z.string().min(1, "Nama pembeli wajib diisi"),
  kontak: z.string().min(1, "Kontak wajib diisi"),
  catatan: z.string().optional(),
});

export type OrderFormState = { error?: string } | undefined;

type CartItem = { variantId: string; jumlah: number };

/** Ambil item keranjang dari form (itemVariantId[]/itemJumlah[]), gabung varian sama. */
function parseCart(formData: FormData): CartItem[] {
  const vids = formData.getAll("itemVariantId").map(String);
  const qtys = formData.getAll("itemJumlah").map(String);
  const items: CartItem[] = [];
  vids.forEach((vid, i) => {
    if (!vid) return;
    const j = Math.max(1, Math.round(Number(qtys[i] ?? 1)) || 1);
    const ex = items.find((it) => it.variantId === vid);
    if (ex) ex.jumlah += j;
    else items.push({ variantId: vid, jumlah: j });
  });
  return items;
}

/** Validasi tiap item + cek kuota per item, kembalikan data item + price snapshot. */
async function buildItemsWithQuota(
  tx: Prisma.TransactionClient,
  campaignId: string,
  cart: CartItem[],
  excludeOrderId?: string,
) {
  if (cart.length === 0) throw new Error("Minimal satu item varian.");
  const itemsData: {
    variantId: string;
    jumlah: number;
    hargaSaatPesan: Prisma.Decimal;
  }[] = [];
  for (const it of cart) {
    const variant = await tx.variant.findUniqueOrThrow({
      where: { id: it.variantId },
    });
    if (variant.campaignId !== campaignId) {
      throw new Error("Varian tidak sesuai kampanye.");
    }
    // FR-2.2: kuota dicek & direservasi per item.
    const terisiLain = await terisiOneVariant(tx, variant.id, excludeOrderId);
    if (terisiLain + it.jumlah > variant.kuotaMaks) {
      throw new Error(
        `Kuota varian "${variant.namaVarian}" tidak cukup. Sisa: ${variant.kuotaMaks - terisiLain}.`,
      );
    }
    itemsData.push({
      variantId: variant.id,
      jumlah: it.jumlah,
      hargaSaatPesan: variant.harga, // FR-2.3 price snapshot
    });
  }
  return itemsData;
}

export async function createOrder(
  campaignId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const user = await requireUser();

  const parsed = headerSchema.safeParse({
    namaPembeli: formData.get("namaPembeli"),
    kontak: formData.get("kontak"),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const cart = parseCart(formData);

  try {
    await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUniqueOrThrow({
        where: { id: campaignId },
      });
      if (!campaignMenerimaPesanan(campaign.status)) {
        throw new Error(
          "Kampanye tidak lagi menerima pesanan (status bukan Open).",
        );
      }

      const itemsData = await buildItemsWithQuota(tx, campaignId, cart);

      await tx.order.create({
        data: {
          campaignId,
          namaPembeli: d.namaPembeli,
          kontak: d.kontak,
          catatan: d.catatan,
          status: "MENUNGGU_DP",
          tokenAkses: generateAccessToken(), // FR-5.1
          items: { create: itemsData },
          statusLogs: {
            create: {
              statusLama: null,
              statusBaru: "MENUNGGU_DP",
              catatan: "Pesanan dibuat",
              dibuatOlehId: user.id,
            },
          },
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat pesanan" };
  }

  revalidatePath(`/kampanye/${campaignId}`);
  redirect(`/kampanye/${campaignId}?tab=pesanan`);
}

export async function updateOrder(
  orderId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  await requireUser();

  const parsed = headerSchema.safeParse({
    namaPembeli: formData.get("namaPembeli"),
    kontak: formData.get("kontak"),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const cart = parseCart(formData);

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      const itemsData = await buildItemsWithQuota(
        tx,
        order.campaignId,
        cart,
        orderId,
      );

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.update({
        where: { id: orderId },
        data: {
          namaPembeli: d.namaPembeli,
          kontak: d.kontak,
          catatan: d.catatan,
          items: { create: itemsData },
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan" };
  }

  revalidatePath(`/pesanan/${orderId}`);
  redirect(`/pesanan/${orderId}`);
}

export async function changeOrderStatus(orderId: string, formData: FormData) {
  const user = await requireUser();
  const target = String(formData.get("status")) as OrderStatus;
  const catatan = String(formData.get("catatan") ?? "").trim();

  const validStatuses: OrderStatus[] = [
    "MENUNGGU_DP",
    "DP_DITERIMA",
    "LUNAS",
    "PRODUKSI",
    "SIAP_KIRIM",
    "DIKIRIM",
    "SELESAI",
  ];
  if (!validStatuses.includes(target)) {
    throw new Error("Status tidak valid");
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status === target) return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: target },
    }),
    // FR-4.5: log perubahan status pesanan.
    prisma.orderStatusLog.create({
      data: {
        orderId,
        statusLama: order.status,
        statusBaru: target,
        catatan: catatan || null,
        dibuatOlehId: user.id,
      },
    }),
  ]);

  revalidatePath(`/pesanan/${orderId}`);
  revalidatePath(`/kampanye/${order.campaignId}`);
}

export async function cancelOrder(orderId: string, formData: FormData) {
  const user = await requireUser();
  const alasan = String(formData.get("alasanBatal") ?? "").trim();
  if (!alasan) throw new Error("Alasan pembatalan wajib diisi");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status === "DIBATALKAN") return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "DIBATALKAN", alasanBatal: alasan },
    }),
    prisma.orderStatusLog.create({
      data: {
        orderId,
        statusLama: order.status,
        statusBaru: "DIBATALKAN",
        catatan: `Dibatalkan: ${alasan}`,
        dibuatOlehId: user.id,
      },
    }),
  ]);

  // Kuota otomatis kembali karena dihitung dari pesanan non-DIBATALKAN.
  revalidatePath(`/pesanan/${orderId}`);
  revalidatePath(`/kampanye/${order.campaignId}`);
}

// ---------------------------------------------------------------------------
// Pembayaran (Modul 4.3)
// ---------------------------------------------------------------------------

const paymentSchema = z.object({
  jenis: z.enum(["DP", "PELUNASAN", "LUNAS"]),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  tanggal: z.string().optional(),
});

export type PaymentFormState = { error?: string } | undefined;

export async function addPayment(
  orderId: string,
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireUser();

  const parsed = paymentSchema.safeParse({
    jenis: formData.get("jenis"),
    jumlah: formData.get("jumlah"),
    tanggal: formData.get("tanggal") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  let buktiFile: string | null = null;
  try {
    const file = formData.get("bukti");
    buktiFile = await saveBuktiFile(file instanceof File ? file : null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengunggah bukti" };
  }

  await prisma.payment.create({
    data: {
      orderId,
      jenis: d.jenis as PaymentType,
      jumlah: d.jumlah,
      tanggal: d.tanggal ? new Date(d.tanggal) : new Date(),
      buktiFile,
      statusVerifikasi: "MENUNGGU_VERIFIKASI",
    },
  });

  revalidatePath(`/pesanan/${orderId}`);
  return undefined;
}

export async function verifyPayment(
  paymentId: string,
  keputusan: "TERVERIFIKASI" | "DITOLAK",
) {
  await requireUser();
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { statusVerifikasi: keputusan },
    include: { order: { select: { id: true } } },
  });
  revalidatePath(`/pesanan/${payment.order.id}`);
}

export async function deletePayment(paymentId: string) {
  await requireUser();
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    select: { orderId: true },
  });
  await prisma.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/pesanan/${payment.orderId}`);
}
