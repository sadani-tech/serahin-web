"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function updateSellerProfile(formData: FormData) {
  await api.patch("/seller/profile", {
    businessName: String(formData.get("businessName") ?? ""),
    description: String(formData.get("description") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? "") || undefined,
  });
  revalidatePath("/seller/dashboard");
}
