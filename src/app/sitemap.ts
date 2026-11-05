import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // No lastModified: a build timestamp claims a content change on every deploy, which
  // teaches crawlers to ignore the field. Content dates would need a database read here.
  return [
    {
      url: new URL("/", SITE.url).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/privacy", SITE.url).toString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: new URL("/gdpr", SITE.url).toString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
