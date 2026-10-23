import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/privacy", SITE.url).toString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
