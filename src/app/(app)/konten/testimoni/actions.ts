"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

type TestimonialRow = {
  id: string;
  customerName: string;
  productLabel: string | null;
  quote: string;
  rating: number | null;
  orderId: string | null;
  isVerified: boolean;
  nameAnonymized: boolean;
  seller: { id: string } | null;
};

function fullBody(row: TestimonialRow, status: "DRAFT" | "PUBLISHED") {
  return {
    customerName: row.customerName,
    productLabel: row.productLabel ?? undefined,
    quote: row.quote,
    rating: row.rating ?? undefined,
    orderId: row.orderId ?? undefined,
    sellerId: row.seller?.id ?? undefined,
    verified: row.isVerified,
    nameAnonymized: row.nameAnonymized,
    displayNameConsent: !row.nameAnonymized,
    status,
  };
}

export async function publishTestimonial(row: TestimonialRow): Promise<void> {
  await api.patch(`/cms/testimonials/${row.id}`, fullBody(row, "PUBLISHED"));
  revalidatePath("/konten/testimoni");
}

export async function unpublishTestimonial(row: TestimonialRow): Promise<void> {
  await api.patch(`/cms/testimonials/${row.id}`, fullBody(row, "DRAFT"));
  revalidatePath("/konten/testimoni");
}

export async function deleteTestimonialAction(id: string): Promise<void> {
  await api.del(`/cms/testimonials/${id}`);
  revalidatePath("/konten/testimoni");
}
