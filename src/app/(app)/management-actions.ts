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

export async function setSellerPaymentGateway(id: string, enabled: boolean) {
  await api.patch(`/admin/sellers/${id}/payment-gateway`, { enabled });
  revalidatePath(`/penjual/${id}`);
}

function refreshSeller(id: string) {
  revalidatePath("/penjual");
  revalidatePath(`/penjual/${id}`);
  revalidatePath("/dashboard");
}

export async function approveSeller(id: string) {
  await api.post(`/sellers/${id}/approve`);
  refreshSeller(id);
}

export async function resendSellerActivation(id: string) {
  await api.post(`/sellers/${id}/activation`);
  refreshSeller(id);
}

export async function rejectSeller(id: string, formData: FormData) {
  await api.post(`/sellers/${id}/reject`, { reason: String(formData.get("reason") ?? "") });
  refreshSeller(id);
}

export async function suspendSeller(id: string, formData: FormData) {
  await api.post(`/sellers/${id}/suspend`, { reason: String(formData.get("reason") ?? "") });
  refreshSeller(id);
}

export async function reactivateSeller(id: string) {
  await api.post(`/sellers/${id}/reactivate`);
  refreshSeller(id);
}

export async function removeInvalidOrder(campaignId: string, orderId: string, formData: FormData) {
  await api.post(`/admin/preorders/${campaignId}/orders/${orderId}/remove`, payload(formData));
  revalidatePath(`/pre-orders/${campaignId}`);
}
