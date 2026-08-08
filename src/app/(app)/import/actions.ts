"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { type ImportUploadState } from "./constants";

export async function uploadImport(
  _prev: ImportUploadState,
  formData: FormData,
): Promise<ImportUploadState> {
  const mode = String(formData.get("mode") ?? "");
  if (!["KAMPANYE_PENUH", "PESANAN"].includes(mode)) {
    return { error: "Mode import tidak valid." };
  }
  const targetCampaignId = String(formData.get("targetCampaignId") ?? "");
  if (mode === "PESANAN" && !targetCampaignId) {
    return { error: "Kampanye tujuan wajib dipilih untuk Mode B." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File wajib diunggah." };
  }

  const fd = new FormData();
  fd.set("mode", mode);
  if (targetCampaignId) fd.set("targetCampaignId", targetCampaignId);
  fd.set("file", file);

  let res: { draftId: string };
  try {
    res = await api.postForm<{ draftId: string }>("/import/upload", fd);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Gagal membaca file." };
  }
  redirect(`/import/preview/${res.draftId}`);
}

export async function confirmImport(draftId: string) {
  const res = await api.post<{ logId: string }>(
    `/import/draft/${draftId}/confirm`,
  );
  revalidatePath("/import/riwayat");
  revalidatePath("/kampanye");
  redirect(`/import/riwayat?sukses=${res.logId}`);
}

export async function cancelDraft(draftId: string) {
  await api.del(`/import/draft/${draftId}`);
  redirect("/import");
}

export async function rollbackImportAction(importLogId: string) {
  const res = await api.post<{ error?: string }>(
    `/import/riwayat/${importLogId}/rollback`,
  );
  revalidatePath("/import/riwayat");
  revalidatePath("/kampanye");
  return res;
}
