import { requirePublicEnv } from "@/lib/env";

export const SITE = {
  // Canonical production origin, env-driven with no hardcoded fallback. Fails
  // the build loudly on the server if missing; on the client it never throws
  // (would crash hydration) since Next inlines the value.
  url: requirePublicEnv("NEXT_PUBLIC_SITE_URL"),
  name: "Cristache Adrian",
  title: "Aristache | Adrian Cristache - IT Specialist & Software Developer",
  description:
    "Explore Aristache, the personal portfolio of Adrian Cristache. Modern web and mobile development, IT systems, automation, and thoughtful digital solutions.",
  handle: "@aristache-labs",
  sameAs: ["https://github.com/aristache-labs"],
} as const;
