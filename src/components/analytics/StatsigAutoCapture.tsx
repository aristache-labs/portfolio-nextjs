"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStatsigClient } from "@statsig/react-bindings";
import { readConsent, useAnalyticsConsent } from "@/lib/analytics-consent";

export function StatsigAutoCapture() {
  const { client } = useStatsigClient();
  const consent = useAnalyticsConsent();
  const pathname = usePathname();

  useEffect(() => {
    if (consent !== "accepted" || pathname?.startsWith("/admin") || pathname === "/login") {
      return;
    }

    let cancelled = false;
    void import("@statsig/web-analytics").then(
      ({ runStatsigAutoCapture, AutoCaptureEventName }) => {
        if (cancelled || readConsent() !== "accepted") return;

        // The SDK reuses its existing instance, including across route changes.
        runStatsigAutoCapture(client, {
          captureCopyText: false,
          consoleLogAutoCaptureSettings: { enabled: false },
          eventFilterFunc: (event) => {
            const path = window.location.pathname;
            if (readConsent() !== "accepted" || path.startsWith("/admin") || path === "/login") {
              return false;
            }
            if (
              event.eventName !== AutoCaptureEventName.PAGE_VIEW &&
              event.eventName !== AutoCaptureEventName.PAGE_VIEW_END &&
              event.eventName !== AutoCaptureEventName.CLICK
            ) {
              return false;
            }

            // Keep navigation and element identifiers, without form or copied text.
            const metadata = event.metadata ?? {};
            event.metadata = {
              pathname: path,
              hostname: window.location.hostname,
              tagName: String(metadata.tagName ?? ""),
              id: String(metadata.id ?? ""),
            };
            return true;
          },
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [client, consent, pathname]);

  return null;
}
