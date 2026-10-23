"use client";

import { useSyncExternalStore } from "react";

export type AnalyticsConsent = "accepted" | "rejected" | null;
export const CONSENT_KEY = "analytics-consent-v1";
export const PREFERENCES_EVENT = "analytics-preferences-open";
const CHANGE_EVENT = "analytics-consent-change";
let memoryConsent: AnalyticsConsent = null;
let memoryOnly = false;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function googleCommand(...args: unknown[]) {
  const target = window as AnalyticsWindow;
  target.dataLayer ??= [];
  target.gtag ??= function () {
    // Google's command queue uses Arguments objects rather than arrays.
    // eslint-disable-next-line prefer-rest-params
    target.dataLayer!.push(arguments);
  };
  target.gtag(...args);
}

export function applyAnalyticsConsent(consent: AnalyticsConsent) {
  const id = process.env.NEXT_PUBLIC_GTAG_ID;
  if (!id) return;
  const accepted = consent === "accepted";
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = !accepted;
  // Do not create a Google queue before any script has been allowed to load.
  if ((window as AnalyticsWindow).gtag) {
    googleCommand("consent", "update", {
      analytics_storage: accepted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

export function readConsent(): AnalyticsConsent {
  if (memoryOnly) return memoryConsent;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    return memoryConsent;
  }
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  memoryConsent = consent;
  try {
    localStorage.setItem(CONSENT_KEY, consent);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // Keep the choice for this visit when browser storage is unavailable.
  }
  applyAnalyticsConsent(consent);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const notify = () => {
    applyAnalyticsConsent(readConsent());
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function useAnalyticsConsent() {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
