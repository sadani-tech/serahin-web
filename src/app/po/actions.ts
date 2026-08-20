"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { MAX_UNIT_PER_SUBMISSION, type PublicOrderState } from "./constants";

// Keranjang dikirim sebagai satu field JSON ("cart") dari state klien.
function parseCart(formData: FormData) {
  const raw = formData.get("cart");
  let parsed: unknown = [];
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }
  const items: { variantId: string; jumlah: number; warna?: string }[] = [];
  if (Array.isArray(parsed)) {
    for (const it of parsed) {
      const vid = String((it as { variantId?: unknown })?.variantId ?? "");
      if (!vid) continue;
      let j = Math.max(
        1,
        Math.round(Number((it as { jumlah?: unknown })?.jumlah ?? 1)) || 1,
      );
      j = Math.min(j, MAX_UNIT_PER_SUBMISSION);
      const warna =
        String((it as { warna?: unknown })?.warna ?? "").trim() || undefined;
      const ex = items.find(
        (x) => x.variantId === vid && (x.warna ?? "") === (warna ?? ""),
      );
      if (ex) ex.jumlah = Math.min(MAX_UNIT_PER_SUBMISSION, ex.jumlah + j);
      else items.push({ variantId: vid, jumlah: j, warna });
    }
  }
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

  const jumlahBayarRaw = String(formData.get("jumlahBayar") ?? "").replace(
    /\D/g,
    "",
  );
  const jumlahBayar = jumlahBayarRaw ? Number(jumlahBayarRaw) : 0;
  if (jumlahBayar <= 0) return { error: "Jumlah bayar wajib diisi." };

  const confirmDuplikat = formData.get("confirmDuplikat") === "1";
  const confirmPerubahanKuota = formData.get("confirmPerubahanKuota") === "1";

  // Kirim sebagai multipart/form-data agar bisa menyertakan bukti pembayaran (FR-upload-bukti)
  const fd = new FormData();
  fd.set("namaPembeli", namaPembeli);
  fd.set("kontak", kontak);
  fd.set("items", JSON.stringify(items));
  fd.set("jumlahBayar", String(jumlahBayar));
  fd.set("confirmDuplikat", confirmDuplikat ? "1" : "0");
  fd.set("confirmPerubahanKuota", confirmPerubahanKuota ? "1" : "0");

  // Bukti pembayaran opsional — dikirim hanya jika file valid dipilih
  const bukti = formData.get("buktiPembayaran");
  if (bukti instanceof File && bukti.size > 0) fd.set("buktiPembayaran", bukti);

  let result: { tokenAkses?: string; needsConfirm?: boolean; needsCartConfirm?: boolean; warning?: string };
  try {
    result = await api.postForm(`/public/form/${formToken}/order`, fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengirim pesanan." };
  }

  if (result.needsConfirm) {
    return { warning: result.warning, needsConfirm: true };
  }
  if (result.needsCartConfirm) {
    return { warning: result.warning, needsCartConfirm: true };
  }
  redirect(`/po/sukses/${result.tokenAkses}`);
}
