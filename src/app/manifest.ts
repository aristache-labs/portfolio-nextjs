import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/site";
import { GROUND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "Adrian",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    // Was hardcoded #07070c, which had drifted from the dark ground in globals.css.
    background_color: GROUND.dark,
    theme_color: GROUND.dark,
    icons: [{ src: "/icon.png", sizes: "32x32", type: "image/png", purpose: "maskable" }],
  };
}
