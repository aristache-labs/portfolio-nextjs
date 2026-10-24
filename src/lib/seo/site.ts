import { requirePublicEnv } from "@/lib/env";
import { IDENTITY } from "@/lib/identity";

export const SITE = {
  // Canonical production origin, env-driven with no hardcoded fallback. Fails
  // the build loudly on the server if missing; on the client it never throws
  // (would crash hydration) since Next inlines the value.
  url: requirePublicEnv("NEXT_PUBLIC_SITE_URL"),
  ...IDENTITY,
  title: `Aristache | ${IDENTITY.name} - ${IDENTITY.jobTitle}`,
  description: `${IDENTITY.name} - ${IDENTITY.positioning}. Enterprise IT deployments, workflow automation, and reliable applications.`,
  handle: "@aristache-labs",
  sameAs: ["https://github.com/aristache-labs"],
} as const;
