import type { MetadataRoute } from "next";
import { publicSite } from "@/lib/public-site";
import { getPublicCatalog } from "@/lib/public-catalog";
import { toPublicSlug } from "@/lib/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = [
    { path: "", priority: 1, frequency: "daily" as const },
    { path: "/about", priority: 0.7, frequency: "yearly" as const },
    { path: "/contact", priority: 0.7, frequency: "yearly" as const },
    { path: "/arsip", priority: 0.6, frequency: "weekly" as const },
    { path: "/terms", priority: 0.5, frequency: "yearly" as const },
    { path: "/refund-policy", priority: 0.5, frequency: "yearly" as const },
    { path: "/privacy", priority: 0.5, frequency: "yearly" as const },
    { path: "/data-deletion", priority: 0.4, frequency: "yearly" as const },
  ];
  const base = routes.map((route) => ({
    url: `${publicSite.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
  try {
    const [first, archiveFirst] = await Promise.all([getPublicCatalog({ page: 1, limit: 48 }), getPublicCatalog({ page: 1, limit: 48, archive: true })]);
    const [pages, archivePages] = await Promise.all([
      Promise.all(Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, index) => getPublicCatalog({ page: index + 2, limit: 48 }))),
      Promise.all(Array.from({ length: Math.max(0, archiveFirst.meta.totalPages - 1) }, (_, index) => getPublicCatalog({ page: index + 2, limit: 48, archive: true }))),
    ]);
    const catalogs = [first, ...pages, archiveFirst, ...archivePages];
    const seenProducts = new Set<string>();
    const productUrls = catalogs.flatMap((catalog) => catalog.campaigns).flatMap((campaign) => campaign.variants
      .filter((variant) => variant.productSlug)
      .map((variant) => `${publicSite.url}/s/${campaign.seller.slug}/produk/${variant.productSlug}`))
      .filter((url) => !seenProducts.has(url) && Boolean(seenProducts.add(url)))
      .map((url) => ({ url, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }));
    const categoryUrls = first.filters.categories.map((category) => ({ url: `${publicSite.url}/catalog/${toPublicSlug(category)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }));
    return [...base, ...productUrls, ...categoryUrls];
  } catch {
    return base;
  }
}
