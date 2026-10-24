"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { readConsent, useAnalyticsConsent } from "@/lib/analytics-consent";

const StatsigAnalytics = dynamic(() => import("@/components/analytics/StatsigAnalytics"), {
  ssr: false,
});

function clearStatsigStorage() {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[name];
      for (const key of Object.keys(storage)) {
        if (key.startsWith("statsig.")) storage.removeItem(key);
      }
    } catch {
      // Storage may be unavailable. No SDK is started without consent.
    }
  }
}

export default function MyStatsig({ children }: { children: ReactNode }) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const privateRoute = pathname?.startsWith("/admin") || pathname === "/login";

  useEffect(() => {
    if (readConsent() !== "accepted") clearStatsigStorage();
  }, [consent]);

  return (
    <>
      {children}
      {sdkKey && consent === "accepted" && !privateRoute && <StatsigAnalytics sdkKey={sdkKey} />}
    </>
  );
}
