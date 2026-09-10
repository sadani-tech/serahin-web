"use server";

import { api, ApiError } from "@/lib/api";

export type DataDeletionState =
  | { ok: true; reference: string; message: string }
  | { ok?: false; error: string }
  | undefined;

export async function requestDataDeletion(
  _previous: DataDeletionState,
  formData: FormData,
): Promise<DataDeletionState> {
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const orderReference = String(formData.get("orderReference") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (website) return { error: "Permintaan tidak dapat diproses." };
  if (!email && !phone) return { error: "Isi minimal email atau nomor WhatsApp." };
  if (reason.length < 5) return { error: "Jelaskan permintaan Anda secara singkat." };

  try {
    const result = await api.post<{
      reference: string;
      message: string;
    }>("/public/data-deletion-requests", {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(orderReference ? { orderReference } : {}),
      reason,
    });
    return { ok: true, reference: result.reference, message: result.message };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Permintaan belum dapat dikirim. Silakan hubungi email dukungan.",
    };
  }
}

export type CommunicationPreferenceState =
  | { ok: true; message: string }
  | { ok?: false; error: string }
  | undefined;

export async function withdrawCommunicationConsent(
  _previous: CommunicationPreferenceState,
  formData: FormData,
): Promise<CommunicationPreferenceState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const orderReference = String(formData.get("orderReference") ?? "").trim();
  if (!phone || !orderReference) {
    return { error: "Nomor WhatsApp dan token portal pesanan wajib diisi." };
  }
  try {
    const result = await api.post<{ message: string }>(
      "/public/communication-consent/withdraw",
      { phone, orderReference },
    );
    return { ok: true, message: result.message };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Preferensi belum dapat diperbarui. Silakan hubungi dukungan.",
    };
  }
}
