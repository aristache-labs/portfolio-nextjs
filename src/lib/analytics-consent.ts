"use client";

import { useSyncExternalStore } from "react";

export type AnalyticsConsent = "accepted" | "rejected" | null;
export const CONSENT_KEY = "analytics-consent-v2";
export const PREFERENCES_EVENT = "analytics-preferences-open";
export const CHANGE_EVENT = "analytics-consent-change";
let memoryConsent: AnalyticsConsent = null;
let memoryOnly = false;
const subscribers = new Set<() => void>();

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

export function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!name.startsWith("_ga")) continue;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; domain=.aristache.dev; path=/`;
  }
}

export function applyAnalyticsConsent(consent: AnalyticsConsent) {
  if (consent === "rejected") clearAnalyticsCookies();
  const id = process.env.NEXT_PUBLIC_GTAG_ID;
  if (!id) return;
  const privateRoute =
    window.location.pathname.startsWith("/admin") || window.location.pathname === "/login";
  const accepted = consent === "accepted";
  // Consent is global to the visit; private-route suppression is a separate collection gate.
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = privateRoute || !accepted;
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

function notifySubscribers() {
  subscribers.forEach((notify) => notify());
}

function handleStorage(event: StorageEvent) {
  if (event.key !== CONSENT_KEY && event.key !== null) return;
  if (event.storageArea && event.storageArea !== window.localStorage) return;
  applyAnalyticsConsent(readConsent());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  if (subscribers.size === 0) {
    window.addEventListener(CHANGE_EVENT, notifySubscribers);
    window.addEventListener("storage", handleStorage);
  }
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
    if (subscribers.size === 0) {
      window.removeEventListener(CHANGE_EVENT, notifySubscribers);
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function useAnalyticsConsent() {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
