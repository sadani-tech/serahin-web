"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/token";
import { ORDER_STATUS_NONAKTIF } from "@/lib/domain";
import { terisiOneVariant } from "@/lib/quota";
import { Prisma } from "@/generated/prisma";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "./constants";

// Ambang deteksi duplikat (FR-1.5 v1.2 / open Q#1)
const DUPLICATE_WINDOW_MENIT = 10;

const headerSchema = z.object({
  namaPembeli: z.string().min(1, "Nama wajib diisi"),
  kontak: z.string().min(1, "Kontak (WA/email) wajib diisi"),
});

type CartItem = { variantId: string; jumlah: number };

function parseCart(formData: FormData): CartItem[] {
  const vids = formData.getAll("itemVariantId").map(String);
  const qtys = formData.getAll("itemJumlah").map(String);
  const items: CartItem[] = [];
  vids.forEach((vid, i) => {
    if (!vid) return;
    let j = Math.max(1, Math.round(Number(qtys[i] ?? 1)) || 1);
    j = Math.min(j, MAX_UNIT_PER_SUBMISSION);
    const ex = items.find((it) => it.variantId === vid);
    if (ex) ex.jumlah = Math.min(MAX_UNIT_PER_SUBMISSION, ex.jumlah + j);
    else items.push({ variantId: vid, jumlah: j });
  });
  return items;
}

export async function createPublicOrder(
  formToken: string,
  _prev: PublicOrderState,
  formData: FormData,
): Promise<PublicOrderState> {
  const parsed = headerSchema.safeParse({
    namaPembeli: formData.get("namaPembeli"),
    kontak: formData.get("kontak"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const cart = parseCart(formData);
  if (cart.length === 0) {
    return { error: "Pilih minimal satu varian." };
  }
  const confirmDuplikat = formData.get("confirmDuplikat") === "1";
  const kontak = d.kontak.trim();

  let tokenAkses: string;

  try {
    tokenAkses = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({ where: { formToken } });
      if (!campaign) throw new Error("Formulir tidak ditemukan.");
      if (campaign.status !== "OPEN") {
        throw new Error("Kampanye ini sudah tidak menerima pesanan.");
      }
      if (!campaign.formAktif) {
        throw new Error("Formulir pesanan sedang dinonaktifkan sementara.");
      }

      // FR-3.2: validasi kuota PER ITEM (parsial — item habis dilewati).
      const itemsData: {
        variantId: string;
        jumlah: number;
        hargaSaatPesan: Prisma.Decimal;
      }[] = [];
      const ditolak: string[] = [];
      for (const it of cart) {
        const variant = await tx.variant.findUnique({
          where: { id: it.variantId },
        });
        if (!variant || variant.campaignId !== campaign.id) continue;
        const terisi = await terisiOneVariant(tx, variant.id);
        const sisa = variant.kuotaMaks - terisi;
        if (sisa <= 0 || it.jumlah > sisa) {
          ditolak.push(variant.namaVarian);
          continue;
        }
        itemsData.push({
          variantId: variant.id,
          jumlah: it.jumlah,
          hargaSaatPesan: variant.harga,
        });
      }

      if (itemsData.length === 0) {
        throw new Error(
          `Semua varian yang dipilih sudah habis kuotanya${ditolak.length ? `: ${ditolak.join(", ")}` : ""}. Silakan sesuaikan pilihan.`,
        );
      }

      // FR-3.3: deteksi duplikat berbasis kontak + kampanye (bukan per-varian).
      const sejak = new Date(Date.now() - DUPLICATE_WINDOW_MENIT * 60 * 1000);
      const duplikat = await tx.order.findFirst({
        where: {
          campaignId: campaign.id,
          kontak,
          createdAt: { gte: sejak },
          status: { notIn: ORDER_STATUS_NONAKTIF },
        },
      });
      if (duplikat && !confirmDuplikat) {
        throw new DuplicateSignal();
      }

      const order = await tx.order.create({
        data: {
          campaignId: campaign.id,
          namaPembeli: d.namaPembeli.trim(),
          kontak,
          status: "BARU_MASUK", // v1.2 FR-1.4
          sumberPesanan: "FORM_PUBLIK",
          flagDuplikat: !!duplikat,
          tokenAkses: generateAccessToken(),
          items: { create: itemsData },
          statusLogs: {
            create: {
              statusLama: null,
              statusBaru: "BARU_MASUK",
              catatan: "Pesanan masuk dari formulir publik",
            },
          },
        },
      });
      return order.tokenAkses;
    });
  } catch (e) {
    if (e instanceof DuplicateSignal) {
      return {
        warning:
          "Sepertinya Anda baru saja mengirim pesanan untuk kampanye ini beberapa menit lalu. Jika ini disengaja, klik kirim sekali lagi untuk melanjutkan.",
        needsConfirm: true,
      };
    }
    return {
      error: e instanceof Error ? e.message : "Gagal mengirim pesanan.",
    };
  }

  // FR-1.6: arahkan ke halaman konfirmasi + link portal.
  redirect(`/po/sukses/${tokenAkses}`);
}

class DuplicateSignal extends Error {}
