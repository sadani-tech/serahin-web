"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

function refresh() {
  revalidatePath("/seller-applications");
  revalidatePath("/dashboard");
}

export async function approveSeller(id: string) {
  await api.post(`/sellers/${id}/approve`);
  refresh();
}

export async function resendSellerActivation(id: string) {
  await api.post(`/sellers/${id}/activation`);
  refresh();
}

export async function rejectSeller(id: string, formData: FormData) {
  await api.post(`/sellers/${id}/reject`, { reason: String(formData.get("reason") ?? "") });
  refresh();
}

export async function suspendSeller(id: string, formData: FormData) {
  await api.post(`/sellers/${id}/suspend`, { reason: String(formData.get("reason") ?? "") });
  refresh();
}

export async function reactivateSeller(id: string) {
  await api.post(`/sellers/${id}/reactivate`);
  refresh();
}
