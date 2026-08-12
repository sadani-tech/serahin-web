"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function deleteCampaign(id: string) {
  await api.deleteCampaign(id);
  revalidatePath("/kampanye");
}
