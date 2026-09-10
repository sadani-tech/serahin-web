import type { MetadataRoute } from "next";
import { publicSite } from "@/lib/public-site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "", priority: 1, frequency: "daily" as const },
    { path: "/about", priority: 0.7, frequency: "yearly" as const },
    { path: "/contact", priority: 0.7, frequency: "yearly" as const },
    { path: "/terms", priority: 0.5, frequency: "yearly" as const },
    { path: "/refund-policy", priority: 0.5, frequency: "yearly" as const },
    { path: "/privacy", priority: 0.5, frequency: "yearly" as const },
    { path: "/data-deletion", priority: 0.4, frequency: "yearly" as const },
  ];
  return routes.map((route) => ({
    url: `${publicSite.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
