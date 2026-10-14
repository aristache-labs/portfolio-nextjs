import { requirePublicEnv } from "@/lib/env";

export const SITE = {
  // Canonical production origin, env-driven with no hardcoded fallback. Fails
  // the build loudly on the server if missing; on the client it never throws
  // (would crash hydration) since Next inlines the value.
  url: requirePublicEnv("NEXT_PUBLIC_SITE_URL"),
  name: "Cristache Adrian",
  title: "Cristache Adrian - IT Technician & Developer",
  description:
    "Cristache Adrian is an IT technician and developer who builds mobile apps with React Native and web apps with Next.js.",
  handle: "@aristache-labs",
  sameAs: ["https://github.com/aristache-labs"],
} as const;
