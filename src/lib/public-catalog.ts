import { api } from "@/lib/api";
import type { PaymentScheme } from "@/lib/types";
import type { PublicVariantOption } from "@/app/po/[token]/PublicOrderForm";

export type PublicCatalogCampaign = {
  id: string;
  formToken: string;
  namaProduk: string;
  deskripsi: string | null;
  paymentScheme: PaymentScheme;
  tanggalTutup: string;
  gatewayEnabled: boolean;
  status: string;
  bukaPesanan: boolean;
  seller: { slug: string; businessName: string };
  variants: PublicVariantOption[];
};

export type PublicCatalogResponse = {
  campaigns: PublicCatalogCampaign[];
  filters: {
    campaigns: Array<{ id: string; label: string }>;
    sellers: Array<{ slug: string; label: string }>;
    categories: string[];
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export function getPublicCatalog(query: {
  campaign?: string;
  seller?: string;
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  archive?: boolean;
}) {
  return api.get<PublicCatalogResponse>("/public/catalog", query);
}

export type PublicTestimonial = {
  id: string;
  customerName: string;
  quote: string;
  rating: number | null;
  verified: boolean;
  seller: { slug: string; businessName: string } | null;
};

export function getPublicTestimonials() {
  return api.get<PublicTestimonial[]>("/public/testimonials");
}
