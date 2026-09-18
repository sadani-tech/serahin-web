import { api } from "@/lib/api";
import type { PaymentScheme } from "@/lib/types";

export type PublicOffering = {
  salesEventId: string;
  formToken: string;
  eventTitle: string;
  status: string;
  endsAt: string;
  price: number;
  quotaRemaining: number;
  label: string | null;
  orderable: boolean;
  paymentScheme: PaymentScheme;
  productionEstimate: string | null;
  shippingEstimate: string | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  canonicalSlug: string;
  redirected: boolean;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gatewayEnabled: boolean;
  orderable: boolean;
  seller: { slug: string; businessName: string; description: string | null; logoUrl: string | null };
  variants: Array<{
    id: string;
    name: string;
    sku: string | null;
    category: string;
    size: string | null;
    material: string | null;
    description: string | null;
    images: string[];
    colors: string[];
    offering: PublicOffering | null;
    offerings: PublicOffering[];
  }>;
};

export function getPublicProduct(sellerSlug: string, productSlug: string) {
  return api.get<PublicProduct>(`/public/store/${encodeURIComponent(sellerSlug)}/products/${encodeURIComponent(productSlug)}`);
}
