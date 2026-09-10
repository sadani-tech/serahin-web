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
  variants: PublicVariantOption[];
};

export type PublicCatalogResponse = {
  campaigns: PublicCatalogCampaign[];
  filters: {
    campaigns: Array<{ id: string; label: string }>;
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
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  return api.get<PublicCatalogResponse>("/public/catalog", query);
}
