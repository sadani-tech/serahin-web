"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";

export type OrderFormState = { error?: string } | undefined;

const headerSchema = z.object({
  namaPembeli: z.string().min(1, "Nama pembeli wajib diisi"),
  wa: z.string().min(1, "WhatsApp wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  catatan: z.string().optional(),
});

function buildKontak(wa: string, email?: string): string {
  return email ? `${wa}, ${email}` : wa;
}

function parseCart(formData: FormData) {
  const vids = formData.getAll("itemVariantId").map(String);
  const qtys = formData.getAll("itemJumlah").map(String);
  const warnas = formData.getAll("itemWarna").map(String);
  const items: { variantId: string; jumlah: number; warna?: string }[] = [];
  vids.forEach((vid, i) => {
    if (!vid) return;
    const j = Math.max(1, Math.round(Number(qtys[i] ?? 1)) || 1);
    const warna = (warnas[i] ?? "").trim() || undefined;
    const ex = items.find(
      (it) => it.variantId === vid && (it.warna ?? "") === (warna ?? ""),
    );
    if (ex) ex.jumlah += j;
    else items.push({ variantId: vid, jumlah: j, warna });
  });
  return items;
}

export async function createOrder(
  campaignId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = headerSchema.safeParse({
    namaPembeli: formData.get("namaPembeli"),
    wa: formData.get("wa"),
    email: formData.get("email")?.toString(),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const kontak = buildKontak(String(parsed.data.wa), parsed.data.email);
  try {
    const fd = new FormData();
    fd.set("campaignId", campaignId);
    fd.set("namaPembeli", parsed.data.namaPembeli);
    fd.set("kontak", kontak);
    if (parsed.data.catatan) fd.set("catatan", parsed.data.catatan);
    fd.set("items", JSON.stringify(parseCart(formData)));

    // Nominal bayar opsional (bila admin input saat buat pesanan)
    const jumlahBayar = formData.get("jumlahBayar");
    if (jumlahBayar && Number(jumlahBayar) > 0) {
      fd.set("jumlahBayar", String(Number(jumlahBayar)));
    }

    // Bukti pembayaran opsional (FR-upload-bukti)
    const bukti = formData.get("buktiPembayaran");
    if (bukti instanceof File && bukti.size > 0) fd.set("buktiPembayaran", bukti);

    await api.postForm("/pesanan", fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal membuat pesanan" };
  }
  revalidatePath(`/pre-orders/${campaignId}`);
  redirect(`/pre-orders/${campaignId}?tab=pesanan`);
}

export async function updateOrder(
  orderId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = headerSchema.safeParse({
    namaPembeli: formData.get("namaPembeli"),
    wa: formData.get("wa"),
    email: formData.get("email")?.toString(),
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const kontak = buildKontak(String(parsed.data.wa), parsed.data.email);
  try {
    await api.patch(`/pesanan/${orderId}`, {
      ...parsed.data,
      kontak,
      items: parseCart(formData),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/pesanan/${orderId}`);
  redirect(`/pesanan/${orderId}`);
}

export async function bulkUpdateOrderStatus(
  campaignId: string,
  ids: string[],
  status: string,
): Promise<{ updated?: number; error?: string }> {
  if (ids.length === 0) return { updated: 0 };
  try {
    const res = await api.post<{ updated: number }>("/pesanan/bulk-status", {
      ids,
      status,
    });
    revalidatePath(`/pre-orders/${campaignId}`);
    return { updated: res.updated };
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Gagal memperbarui status",
    };
  }
}

export async function changeOrderStatus(orderId: string, formData: FormData) {
  await api.post(`/pesanan/${orderId}/status`, {
    status: String(formData.get("status") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  });
  revalidatePath(`/pesanan/${orderId}`);
}

export async function cancelOrder(orderId: string, formData: FormData) {
  await api.post(`/pesanan/${orderId}/cancel`, {
    alasanBatal: String(formData.get("alasanBatal") ?? ""),
  });
  revalidatePath(`/pesanan/${orderId}`);
}

// --- Pembayaran ---

export type PaymentFormState = { error?: string } | undefined;

export async function addPayment(
  orderId: string,
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const jenis = String(formData.get("jenis") ?? "");
  const jumlah = Number(formData.get("jumlah") ?? 0);
  if (!jenis) return { error: "Jenis pembayaran wajib dipilih" };
  if (!(jumlah > 0)) return { error: "Jumlah harus lebih dari 0" };

  const fd = new FormData();
  fd.set("jenis", jenis);
  fd.set("jumlah", String(jumlah));
  const tanggal = formData.get("tanggal");
  if (tanggal) fd.set("tanggal", String(tanggal));
  const bukti = formData.get("bukti");
  if (bukti instanceof File && bukti.size > 0) fd.set("bukti", bukti);

  // Metode pengiriman (v1.8) — hanya relevan saat jenis PELUNASAN. Backend
  // memvalidasi kewajiban metode/alamat sesuai jenis & pilihan.
  if (jenis === "PELUNASAN") {
    const metode = String(formData.get("metodePengiriman") ?? "").trim();
    if (metode === "SHOPEE" || metode === "EKSPEDISI") {
      fd.set("metodePengiriman", metode);
      const alamat = String(formData.get("alamatPengiriman") ?? "").trim();
      if (metode === "EKSPEDISI") {
        if (!alamat) {
          return {
            error:
              "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi.",
          };
        }
        fd.set("alamatPengiriman", alamat);
      }
    } else {
      return { error: "Pilih metode pengiriman untuk pelunasan." };
    }
  }

  try {
    await api.postForm(`/pesanan/${orderId}/payments`, fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/pesanan/${orderId}`);
  return undefined;
}

/**
 * Verifikasi pembayaran — opsional koreksi nominal bila payment dibuat dengan
 * jumlah placeholder 0 (saat upload bukti pada saat buat pesanan).
 */
export async function verifyPayment(
  paymentId: string,
  keputusan: "TERVERIFIKASI" | "DITOLAK",
  jumlah?: number,
) {
  const res = await api.post<{ id?: string; campaign?: { id: string } }>(
    `/payments/${paymentId}/verify`,
    { keputusan, ...(jumlah !== undefined && jumlah > 0 && { jumlah }) },
  );
  if (res?.id) revalidatePath(`/pesanan/${res.id}`);
}

export async function deletePayment(paymentId: string) {
  const res = await api.del<{ id?: string }>(`/payments/${paymentId}`);
  if (res?.id) revalidatePath(`/pesanan/${res.id}`);
}
