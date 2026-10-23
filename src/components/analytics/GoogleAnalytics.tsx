"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  applyAnalyticsConsent,
  googleCommand,
  readConsent,
  useAnalyticsConsent,
} from "@/lib/analytics-consent";

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GTAG_ID;
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const initialized = useRef(false);
  const privateRoute = pathname?.startsWith("/admin") || pathname === "/login";

  useEffect(() => {
    applyAnalyticsConsent(privateRoute ? "rejected" : consent);
  }, [consent, privateRoute]);

  if (!id || consent !== "accepted" || privateRoute) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      strategy="lazyOnload"
      onReady={() => {
        if (
          readConsent() !== "accepted" ||
          window.location.pathname.startsWith("/admin") ||
          window.location.pathname === "/login"
        )
          return;
        applyAnalyticsConsent(consent);
        if (initialized.current) return;
        initialized.current = true;
        googleCommand("consent", "default", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        googleCommand("js", new Date());
        googleCommand("config", id);
      }}
    />
  );
}
