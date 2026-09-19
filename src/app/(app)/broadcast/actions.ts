"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export type BroadcastOptions = {
  sellerId: string;
  campaigns: Array<{ id: string; name: string; status: string }>;
  products: Array<{ id: string; name: string; variants: Array<{ id: string; name: string }> }>;
};
export type BroadcastPayload = {
  sellerId?: string;
  name: string;
  purpose: string;
  subject: string;
  body: string;
  campaignIds?: string[];
  productIds?: string[];
  variantIds?: string[];
  readyForSettlement?: boolean;
  excludePendingPayment?: boolean;
};
export type BroadcastPreview = {
  recipientCount: number;
  maximumRecipients: number;
  excluded: Record<string, number>;
  sample: Array<{ name: string; email: string; orderCount: number; products: string[] }>;
};

export async function loadBroadcastOptions(sellerId?: string): Promise<{ data?: BroadcastOptions; error?: string }> {
  try { return { data: await api.get<BroadcastOptions>("/broadcasts/options", { sellerId }) }; }
  catch (error) { return { error: error instanceof ApiError ? error.message : "Gagal memuat produk Seller." }; }
}

export async function previewBroadcast(payload: BroadcastPayload): Promise<{ data?: BroadcastPreview; error?: string }> {
  try { return { data: await api.post<BroadcastPreview>("/broadcasts/preview", payload) }; }
  catch (error) { return { error: error instanceof ApiError ? error.message : "Gagal menghitung audience." }; }
}

export async function createBroadcast(payload: BroadcastPayload): Promise<{ id?: string; error?: string }> {
  try {
    const result = await api.post<{ id: string }>("/broadcasts", payload);
    revalidatePath("/broadcast");
    return { id: result.id };
  } catch (error) { return { error: error instanceof ApiError ? error.message : "Gagal membuat broadcast." }; }
}

export async function cancelBroadcast(id: string) {
  await api.post(`/broadcasts/${id}/cancel`);
  revalidatePath("/broadcast");
}
export async function retryBroadcast(id: string) {
  await api.post(`/broadcasts/${id}/retry-failed`);
  revalidatePath("/broadcast");
}

