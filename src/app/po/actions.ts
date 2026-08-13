"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "./constants";

function parseCart(formData: FormData) {
  const vids = formData.getAll("itemVariantId").map(String);
  const qtys = formData.getAll("itemJumlah").map(String);
  const items: { variantId: string; jumlah: number }[] = [];
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
  const namaPembeli = String(formData.get("namaPembeli") ?? "").trim();
  const wa = String(formData.get("wa") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!namaPembeli) return { error: "Nama wajib diisi" };
  if (!wa) return { error: "WhatsApp wajib diisi" };
  if (!email) return { error: "Email wajib diisi" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid" };
  }
  const kontak = wa + (email ? `, ${email}` : "");

  const items = parseCart(formData);
  if (items.length === 0) return { error: "Pilih minimal satu varian." };

  const confirmDuplikat = formData.get("confirmDuplikat") === "1";

  // Kirim sebagai multipart/form-data agar bisa menyertakan bukti pembayaran (FR-upload-bukti)
  const fd = new FormData();
  fd.set("namaPembeli", namaPembeli);
  fd.set("kontak", kontak);
  fd.set("items", JSON.stringify(items));
  fd.set("confirmDuplikat", confirmDuplikat ? "1" : "0");

  // Bukti pembayaran opsional — dikirim hanya jika file valid dipilih
  const bukti = formData.get("buktiPembayaran");
  if (bukti instanceof File && bukti.size > 0) fd.set("buktiPembayaran", bukti);

  let result: { tokenAkses?: string; needsConfirm?: boolean; warning?: string };
  try {
    result = await api.postForm(`/public/form/${formToken}/order`, fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengirim pesanan." };
  }

  if (result.needsConfirm) {
    return { warning: result.warning, needsConfirm: true };
  }
  redirect(`/po/sukses/${result.tokenAkses}`);
}
