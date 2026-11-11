import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/app-url";

// Search engines may read public pages; signed-in and API pages are no use to them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/admin",
        "/*/listings",
        "/*/saved",
        "/*/requests",
        "/*/settings",
        "/*/reset-password",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
