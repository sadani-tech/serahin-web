"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";

function payload(formData: FormData) {
  return { reason: String(formData.get("reason") ?? ""), confirmation: String(formData.get("confirmation") ?? "") };
}

export async function archiveBuyer(id: string, formData: FormData) {
  await api.post(`/admin/buyers/${id}/archive`, payload(formData));
  revalidatePath("/pembeli");
  redirect("/pembeli");
}

export async function archiveSeller(id: string, formData: FormData) {
  await api.post(`/admin/sellers/${id}/archive`, payload(formData));
  revalidatePath("/penjual");
  redirect("/penjual");
}

export async function removeInvalidOrder(campaignId: string, orderId: string, formData: FormData) {
  await api.post(`/admin/preorders/${campaignId}/orders/${orderId}/remove`, payload(formData));
  revalidatePath(`/pre-orders/${campaignId}`);
}
