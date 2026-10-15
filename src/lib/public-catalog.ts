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
  sort?: "default" | "name" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
  archive?: boolean;
}) {
  return api.get<PublicCatalogResponse>("/public/catalog", query);
}

/** v2.4.1 FR-39.20 — profil toko untuk Portal Toko (`/store/[sellerSlug]`). */
export type PublicStoreProfile = {
  id: string;
  slug: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  registeredAt: string;
  openCampaignCount: number;
  activeProductCount: number;
  completedOrderCount: number;
  ratingAverage: number | null;
  ratingCount: number;
};

export function getPublicStoreProfile(sellerSlug: string) {
  return api.get<PublicStoreProfile>(`/public/store/${sellerSlug}`);
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
