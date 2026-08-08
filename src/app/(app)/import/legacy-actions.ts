"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { type ImportUploadState } from "./constants";

const ALLOWED_STATUS = [
  "MENUNGGU_DP",
  "DP_DITERIMA",
  "LUNAS",
  "PRODUKSI",
  "SIAP_KIRIM",
  "DIKIRIM",
  "SELESAI",
];

export async function uploadLegacy(
  campaignId: string,
  _prev: ImportUploadState,
  formData: FormData,
): Promise<ImportUploadState> {
  const dpNominal = Number(formData.get("dpNominal"));
  if (!Number.isFinite(dpNominal) || dpNominal <= 0) {
    return { error: "Nominal DP flat harus lebih dari 0." };
  }
  const defaultStatus = String(formData.get("defaultStatus") ?? "");
  if (!ALLOWED_STATUS.includes(defaultStatus)) {
    return { error: "Status default tidak valid." };
  }
  const verifikasi = String(formData.get("verifikasi") ?? "TERVERIFIKASI");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File mentah wajib diunggah." };
  }

  const fd = new FormData();
  fd.set("campaignId", campaignId);
  fd.set("dpNominal", String(dpNominal));
  fd.set("defaultStatus", defaultStatus);
  fd.set("verifikasi", verifikasi);
  fd.set("file", file);

  let res: { draftId: string };
  try {
    res = await api.postForm<{ draftId: string }>("/import/legacy/upload", fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal parsing file." };
  }
  redirect(`/import/legacy/preview/${res.draftId}`);
}

export type LegacyConfirmState = { error?: string } | undefined;

export async function confirmLegacy(
  draftId: string,
  _prev: LegacyConfirmState,
  formData: FormData,
): Promise<LegacyConfirmState> {
  // Kumpulkan resolusi manual varian_<index> → { index: variantId|"SKIP" }.
  const resolutions: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^varian_(\d+)$/);
    if (m) resolutions[m[1]] = String(value);
  }

  let res: { logId: string };
  try {
    res = await api.post<{ logId: string }>(
      `/import/legacy/draft/${draftId}/confirm`,
      { resolutions },
    );
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal mengimpor." };
  }
  revalidatePath("/import/riwayat");
  redirect(`/import/riwayat?sukses=${res.logId}`);
}
