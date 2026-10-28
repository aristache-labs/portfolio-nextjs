import { act, cleanup, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "G-TEST123");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  document.cookie = "_ga=; Max-Age=0; path=/";
  document.cookie = "_ga_TEST123=; Max-Age=0; path=/";
  window.history.replaceState(null, "", "/");
});

describe("analytics consent storage", () => {
  it("requires a fresh choice and persists acceptance and rejection", async () => {
    const consent = await import("./analytics-consent");
    localStorage.setItem("analytics-consent-v1", "accepted");
    expect(consent.readConsent()).toBeNull();
    consent.saveAnalyticsConsent("accepted");
    expect(consent.readConsent()).toBe("accepted");
    expect(localStorage.getItem("analytics-consent-v2")).toBe("accepted");
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(false);
    consent.saveAnalyticsConsent("rejected");
    expect(consent.readConsent()).toBe("rejected");
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
  });
  it("deletes GA cookies for both host and parent domain without deleting other cookies", async () => {
    const consent = await import("./analytics-consent");
    consent.saveAnalyticsConsent("accepted");
    document.cookie = "_ga=visitor; path=/";
    document.cookie = "_ga_TEST123=session; path=/";
    document.cookie = "essential=keep; path=/";
    const setter = vi.spyOn(document, "cookie", "set");
    consent.saveAnalyticsConsent("rejected");
    for (const name of ["_ga", "_ga_TEST123"]) {
      expect(setter).toHaveBeenCalledWith(`${name}=; Max-Age=0; path=/`);
      expect(setter).toHaveBeenCalledWith(`${name}=; Max-Age=0; domain=.aristache.dev; path=/`);
    }
    expect(document.cookie).not.toContain("_ga");
    expect(document.cookie).toContain("essential=keep");
    document.cookie = "essential=; Max-Age=0; path=/";
  });
  it("remembers the choice in memory when storage is unavailable", async () => {
    const consent = await import("./analytics-consent");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    expect(consent.readConsent()).toBeNull();
    consent.saveAnalyticsConsent("accepted");
    expect(consent.readConsent()).toBe("accepted");
    consent.saveAnalyticsConsent("rejected");
    expect(consent.readConsent()).toBe("rejected");
  });
});

it("applies each local change once even with multiple subscribers", async () => {
  const consent = await import("./analytics-consent");
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  const hooks = renderHook(() => [consent.useAnalyticsConsent(), consent.useAnalyticsConsent()]);
  act(() => consent.saveAnalyticsConsent("accepted"));
  expect(hooks.result.current).toEqual(["accepted", "accepted"]);
  expect(gtag).toHaveBeenCalledTimes(1);
  expect(gtag).toHaveBeenLastCalledWith("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  act(() => consent.saveAnalyticsConsent("rejected"));
  expect(hooks.result.current).toEqual(["rejected", "rejected"]);
  expect(gtag).toHaveBeenCalledTimes(2);
  expect(gtag).toHaveBeenLastCalledWith("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
});

it("applies cross-tab changes once, ignores unrelated storage and removes the shared listener", async () => {
  const consent = await import("./analytics-consent");
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  const hooks = renderHook(() => [consent.useAnalyticsConsent(), consent.useAnalyticsConsent()]);
  act(() => {
    localStorage.setItem(consent.CONSENT_KEY, "accepted");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: consent.CONSENT_KEY,
        storageArea: localStorage,
        newValue: "accepted",
      }),
    );
  });
  expect(hooks.result.current).toEqual(["accepted", "accepted"]);
  expect(gtag).toHaveBeenCalledTimes(1);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    window.dispatchEvent(
      new StorageEvent("storage", { key: consent.CONSENT_KEY, storageArea: sessionStorage }),
    );
  });
  expect(gtag).toHaveBeenCalledTimes(1);
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
  });
  expect(hooks.result.current).toEqual([null, null]);
  expect(gtag).toHaveBeenCalledTimes(2);
  hooks.unmount();
  window.dispatchEvent(
    new StorageEvent("storage", { key: consent.CONSENT_KEY, storageArea: localStorage }),
  );
  expect(gtag).toHaveBeenCalledTimes(2);
});

it("keeps a cross-tab acceptance granted while independently suppressing private routes", async () => {
  const consent = await import("./analytics-consent");
  const gtag = vi.fn();
  vi.stubGlobal("gtag", gtag);
  renderHook(() => consent.useAnalyticsConsent());
  window.history.replaceState(null, "", "/admin/settings");
  act(() => {
    localStorage.setItem(consent.CONSENT_KEY, "accepted");
    window.dispatchEvent(
      new StorageEvent("storage", { key: consent.CONSENT_KEY, storageArea: localStorage }),
    );
  });
  expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
  expect(gtag).toHaveBeenCalledExactlyOnceWith("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
});
