"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PublicOrderState } from "./constants";

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
  const items: {
    variantId: string;
    jumlah: number;
    expectedHarga?: number;
    warna?: string;
  }[] = [];
  if (Array.isArray(parsed)) {
    for (const it of parsed) {
      const vid = String((it as { variantId?: unknown })?.variantId ?? "");
      if (!vid) continue;
      const j = Math.max(
        1,
        Math.round(Number((it as { jumlah?: unknown })?.jumlah ?? 1)) || 1,
      );
      const warna =
        String((it as { warna?: unknown })?.warna ?? "").trim() || undefined;
      const hargaRaw = (it as { expectedHarga?: unknown })?.expectedHarga;
      const expectedHarga = Number(hargaRaw);
      const validExpectedHarga =
        hargaRaw !== undefined && Number.isFinite(expectedHarga) && expectedHarga >= 0
          ? expectedHarga
          : undefined;
      const ex = items.find(
        (x) => x.variantId === vid && (x.warna ?? "") === (warna ?? ""),
      );
      if (ex) ex.jumlah = ex.jumlah + j;
      else {
        items.push({
          variantId: vid,
          jumlah: j,
          expectedHarga: validExpectedHarga,
          warna,
        });
      }
    }
  }
  return items;
}

export async function createPublicOrder(
  formToken: string,
  _prev: PublicOrderState,
  formData: FormData,
): Promise<PublicOrderState> {
  const items = parseCart(formData);
  if (items.length === 0) return { error: "Pilih minimal satu varian." };

  const jumlahBayarRaw = String(formData.get("jumlahBayar") ?? "").replace(
    /\D/g,
    "",
  );
  const jumlahBayar = jumlahBayarRaw ? Number(jumlahBayarRaw) : 0;
  const confirmDuplikat = formData.get("confirmDuplikat") === "1";
  const confirmPerubahanKuota = formData.get("confirmPerubahanKuota") === "1";
  const checkoutKey = String(formData.get("checkoutKey") ?? "").trim();
  const checkoutSource =
    formData.get("checkoutSource") === "HOME_CATALOG"
      ? "HOME_CATALOG"
      : "CAMPAIGN_LINK";
  const acceptPolicies = formData.get("acceptPolicies") === "1";
  const whatsappConsent = formData.get("whatsappConsent") === "1";
  const whatsappConsentVersion = String(
    formData.get("whatsappConsentVersion") ?? "",
  ).trim();
  if (!acceptPolicies) {
    return {
      error:
        "Setujui Syarat & Ketentuan, Kebijakan Privasi, dan Kebijakan Refund untuk melanjutkan.",
    };
  }

  // v2.1 — pembeli memilih "Bayar otomatis" (payment gateway).
  const gateway = formData.get("metodeBayar") === "GATEWAY";

  type OrderResult = {
    tokenAkses?: string;
    paymentUrl?: string;
    needsConfirm?: boolean;
    needsCartConfirm?: boolean;
    warning?: string;
  };
  let result: OrderResult;
  const loginCallback = `/po/${formToken}?checkout=1`;

  if (gateway) {
    // Body JSON — pembeli membayar di halaman provider, tidak ada unggahan bukti.
    try {
      result = await api.post<OrderResult>(
        `/public/form/${formToken}/order/gateway`,
        {
          items,
          ...(checkoutKey ? { checkoutKey } : {}),
          ...(jumlahBayar > 0 ? { jumlahBayar } : {}),
          confirmDuplikat,
          confirmPerubahanKuota,
          checkoutSource,
          acceptPolicies,
          whatsappConsent,
          ...(whatsappConsentVersion ? { whatsappConsentVersion } : {}),
        },
      );
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        redirect(`/api/auth/switch?callbackUrl=${encodeURIComponent(loginCallback)}`);
      }
      return {
        error: e instanceof ApiError ? e.message : "Gagal memulai pembayaran.",
      };
    }
  } else {
    if (jumlahBayar <= 0) return { error: "Jumlah bayar wajib diisi." };

    // Kirim sebagai multipart/form-data agar bisa menyertakan bukti pembayaran.
    const fd = new FormData();
    fd.set("items", JSON.stringify(items));
    if (checkoutKey) fd.set("checkoutKey", checkoutKey);
    fd.set("jumlahBayar", String(jumlahBayar));
    fd.set("confirmDuplikat", confirmDuplikat ? "1" : "0");
    fd.set("confirmPerubahanKuota", confirmPerubahanKuota ? "1" : "0");
    fd.set("checkoutSource", checkoutSource);
    fd.set("acceptPolicies", "1");
    fd.set("whatsappConsent", whatsappConsent ? "1" : "0");
    if (whatsappConsentVersion) {
      fd.set("whatsappConsentVersion", whatsappConsentVersion);
    }

    const bukti = formData.get("buktiPembayaran");
    if (bukti instanceof File && bukti.size > 0) fd.set("buktiPembayaran", bukti);

    const includeShopee = formData.get("includeShopee") === "1";
    if (includeShopee) {
      const buktiShopee = formData.get("buktiShopee");
      if (!(buktiShopee instanceof File) || buktiShopee.size === 0) {
        return { error: "Bukti checkout Shopee wajib diunggah." };
      }
      fd.set("includeShopee", "1");
      fd.set("buktiShopee", buktiShopee);
    }

    const metodePengiriman = String(formData.get("metodePengiriman") ?? "").trim();
    if (metodePengiriman === "SHOPEE" || metodePengiriman === "EKSPEDISI") {
      fd.set("metodePengiriman", metodePengiriman);
      const alamatPengiriman = String(formData.get("alamatPengiriman") ?? "").trim();
      if (metodePengiriman === "EKSPEDISI") {
        if (!alamatPengiriman) {
          return { error: "Alamat pengiriman lengkap wajib diisi untuk Manual by Ekspedisi." };
        }
        fd.set("alamatPengiriman", alamatPengiriman);
      }
    }

    try {
      result = await api.postForm<OrderResult>(
        `/public/form/${formToken}/order`,
        fd,
      );
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        redirect(`/api/auth/switch?callbackUrl=${encodeURIComponent(loginCallback)}`);
      }
      return {
        error: e instanceof ApiError ? e.message : "Gagal mengirim pesanan.",
      };
    }
  }

  if (result.needsConfirm) {
    return { warning: result.warning, needsConfirm: true };
  }
  if (result.needsCartConfirm) {
    return { warning: result.warning, needsCartConfirm: true };
  }
  // Gateway: langsung ke halaman pembayaran provider. Manual: ke halaman sukses.
  redirect(
    gateway && result.paymentUrl
      ? result.paymentUrl
      : `/po/sukses/${result.tokenAkses}?campaign=${encodeURIComponent(formToken)}`,
  );
}
