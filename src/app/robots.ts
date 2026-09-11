import type { MetadataRoute } from "next";
import { publicSite } from "@/lib/public-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/terms",
          "/refund-policy",
          "/privacy",
          "/data-deletion",
        ],
        disallow: [
          "/dashboard",
          "/data-privacy",
          "/export",
          "/import",
          "/kampanye",
          "/pre-orders",
          "/konten",
          "/login",
          "/pembeli",
          "/pesanan",
          "/portal/",
          "/po/",
          "/payment/return",
          "/vendor",
          "/verifikasi",
          "/api/",
        ],
      },
    ],
    sitemap: `${publicSite.url}/sitemap.xml`,
    host: publicSite.url,
  };
}
