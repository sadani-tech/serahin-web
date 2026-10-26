"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function updateDeletionRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const internalNote = String(formData.get("internalNote") ?? "").trim();
  if (!id || !status) return;
  await api.patch(`/data-privacy/deletion-requests/${id}`, {
    status,
    internalNote,
  });
  revalidatePath("/data-privacy");
}
