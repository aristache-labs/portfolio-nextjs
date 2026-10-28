"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  CHANGE_EVENT,
  googleCommand,
  readConsent,
  useAnalyticsConsent,
} from "@/lib/analytics-consent";

// 13 months, the ceiling CNIL recommends for analytics cookies. It is also shorter than the
// 14-month GA4 data retention, so a cookie never outlives the data it points to.
const ANALYTICS_COOKIE_LIFETIME_SECONDS = 60 * 60 * 24 * 395;

function isPrivatePath(path: string) {
  return path.startsWith("/admin") || path === "/login";
}

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GTAG_ID;
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const initialized = useRef(false);
  const lastSentPath = useRef<string | null>(null);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const privateRoute = isPrivatePath(pathname ?? "");

  const cancelPageView = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (timer.current !== null) clearTimeout(timer.current);
    frame.current = null;
    timer.current = null;
  }, []);

  const schedulePageView = useCallback(() => {
    const path = window.location.pathname;
    if (
      !initialized.current ||
      readConsent() !== "accepted" ||
      isPrivatePath(path) ||
      lastSentPath.current === path
    )
      return;
    cancelPageView();
    // App Router commits the new document title before this deferred measurement.
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      timer.current = setTimeout(() => {
        timer.current = null;
        if (
          !initialized.current ||
          readConsent() !== "accepted" ||
          window.location.pathname !== path ||
          isPrivatePath(window.location.pathname) ||
          lastSentPath.current === path
        )
          return;
        googleCommand("event", "page_view", {
          page_location: window.location.href,
          page_title: document.title,
        });
        lastSentPath.current = path;
      }, 0);
    });
  }, [cancelPageView]);

  useEffect(() => {
    // Observe withdrawal synchronously, including Reject followed by Accept in one React batch.
    const onConsentChange = () => {
      if (readConsent() === "accepted") {
        schedulePageView();
      } else {
        cancelPageView();
        lastSentPath.current = null;
      }
    };
    window.addEventListener(CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(CHANGE_EVENT, onConsentChange);
  }, [cancelPageView, schedulePageView]);

  useEffect(() => {
    if (id)
      (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] =
        privateRoute || consent !== "accepted";
    cancelPageView();
    if (consent !== "accepted" || privateRoute) {
      lastSentPath.current = null;
    } else if (id) {
      schedulePageView();
    }
    return cancelPageView;
  }, [consent, pathname, privateRoute, id, cancelPageView, schedulePageView]);

  if (!id || consent !== "accepted" || privateRoute) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      strategy="lazyOnload"
      onReady={() => {
        if (readConsent() !== "accepted" || isPrivatePath(window.location.pathname)) return;
        if (!initialized.current) {
          initialized.current = true;
          googleCommand("consent", "default", {
            analytics_storage: "granted",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          });
          googleCommand("js", new Date());
          googleCommand("config", id, {
            allow_google_signals: false,
            send_page_view: false,
            allow_ad_personalization_signals: false,
            cookie_expires: ANALYTICS_COOKIE_LIFETIME_SECONDS,
          });
        }
        schedulePageView();
      }}
    />
  );
}
