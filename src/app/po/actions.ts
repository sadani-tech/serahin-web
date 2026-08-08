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
  const kontak = String(formData.get("kontak") ?? "").trim();
  if (!namaPembeli) return { error: "Nama wajib diisi" };
  if (!kontak) return { error: "Kontak (WA/email) wajib diisi" };

  const items = parseCart(formData);
  if (items.length === 0) return { error: "Pilih minimal satu varian." };

  const confirmDuplikat = formData.get("confirmDuplikat") === "1";

  let result: { tokenAkses?: string; needsConfirm?: boolean; warning?: string };
  try {
    result = await api.post(`/public/form/${formToken}/order`, {
      namaPembeli,
      kontak,
      items,
      confirmDuplikat,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengirim pesanan." };
  }

  if (result.needsConfirm) {
    return { warning: result.warning, needsConfirm: true };
  }
  redirect(`/po/sukses/${result.tokenAkses}`);
}
