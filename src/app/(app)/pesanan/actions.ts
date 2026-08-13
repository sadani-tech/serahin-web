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
  const items: { variantId: string; jumlah: number }[] = [];
  vids.forEach((vid, i) => {
    if (!vid) return;
    const j = Math.max(1, Math.round(Number(qtys[i] ?? 1)) || 1);
    const ex = items.find((it) => it.variantId === vid);
    if (ex) ex.jumlah += j;
    else items.push({ variantId: vid, jumlah: j });
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
    await api.post("/pesanan", {
      campaignId,
      ...parsed.data,
      kontak,
      items: parseCart(formData),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal membuat pesanan" };
  }
  revalidatePath(`/kampanye/${campaignId}`);
  redirect(`/kampanye/${campaignId}?tab=pesanan`);
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

  try {
    await api.postForm(`/pesanan/${orderId}/payments`, fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal menyimpan" };
  }
  revalidatePath(`/pesanan/${orderId}`);
  return undefined;
}

export async function verifyPayment(
  paymentId: string,
  keputusan: "TERVERIFIKASI" | "DITOLAK",
) {
  const res = await api.post<{ id?: string; campaign?: { id: string } }>(
    `/payments/${paymentId}/verify`,
    { keputusan },
  );
  if (res?.id) revalidatePath(`/pesanan/${res.id}`);
}

export async function deletePayment(paymentId: string) {
  const res = await api.del<{ id?: string }>(`/payments/${paymentId}`);
  if (res?.id) revalidatePath(`/pesanan/${res.id}`);
}
