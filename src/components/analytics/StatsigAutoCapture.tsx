"use client";

import { useEffect } from "react";
import { useStatsigClient } from "@statsig/react-bindings";
import { readConsent, useAnalyticsConsent } from "@/lib/analytics-consent";

export function StatsigAutoCapture() {
  const { client } = useStatsigClient();
  const consent = useAnalyticsConsent();

  useEffect(() => {
    const path = window.location.pathname;
    if (consent !== "accepted" || path.startsWith("/admin") || path === "/login") {
      return;
    }

    let cancelled = false;
    void import("@statsig/web-analytics").then(({ AutoCapture, AutoCaptureEventName }) => {
      if (cancelled || readConsent() !== "accepted") return;

      // The convenience helper caches by SDK key and would reuse a withdrawn client.
      new AutoCapture(client, {
        captureCopyText: false,
        consoleLogAutoCaptureSettings: { enabled: false },
        eventFilterFunc: (event) => {
          const path = window.location.pathname;
          if (
            cancelled ||
            readConsent() !== "accepted" ||
            path.startsWith("/admin") ||
            path === "/login"
          ) {
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
    });

    return () => {
      cancelled = true;
    };
  }, [client, consent]);

  return null;
}
