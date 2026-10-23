"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useStatsigClient } from "@statsig/react-bindings";
import { CHANGE_EVENT, readConsent, useAnalyticsConsent } from "@/lib/analytics-consent";

export function StatsigSessionReplay() {
  const { client } = useStatsigClient();
  const consent = useAnalyticsConsent();
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (consent !== "accepted" || pathname?.startsWith("/admin") || pathname === "/login") return;

    let cancelled = false;
    let stop: (() => void) | undefined;
    const stopWithoutConsent = () => {
      if (readConsent() !== "accepted") stop?.();
    };
    window.addEventListener(CHANGE_EVENT, stopWithoutConsent);
    window.addEventListener("storage", stopWithoutConsent);

    void import("@statsig/session-replay")
      .then(({ runStatsigSessionReplay, startRecording, stopRecording }) => {
        const path = window.location.pathname;
        if (
          cancelled ||
          readConsent() !== "accepted" ||
          path.startsWith("/admin") ||
          path === "/login"
        )
          return;

        const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
        stop = () => stopRecording(sdkKey);
        runStatsigSessionReplay(client, {
          rrwebConfig: {
            blockClass: "rr-block",
            blockSelector: "form, [data-replay-block]",
            maskAllInputs: true,
            recordCanvas: false,
            recordCrossOriginIframes: false,
          },
        });
        startRecording(sdkKey);
      })
      .catch(() => {
        // Optional recording must not interrupt the portfolio if its chunk cannot load.
      });

    return () => {
      cancelled = true;
      stop?.();
      window.removeEventListener(CHANGE_EVENT, stopWithoutConsent);
      window.removeEventListener("storage", stopWithoutConsent);
    };
  }, [client, consent, pathname]);

  return null;
}
