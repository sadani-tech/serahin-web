"use server";

import { api, ApiError } from "@/lib/api";

export type FeedbackFormState = { error?: string; success?: boolean } | undefined;

// v2.3.9 FR-42.19: Kritik & Saran Admin/Seller ke tim internal Serahin.
export async function submitFeedback(_prev: FeedbackFormState, formData: FormData): Promise<FeedbackFormState> {
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 5) return { error: "Isi kritik/saran minimal 5 karakter." };
  try {
    await api.post("/feedback", { message });
    return { success: true };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Gagal mengirim. Coba lagi." };
  }
}
