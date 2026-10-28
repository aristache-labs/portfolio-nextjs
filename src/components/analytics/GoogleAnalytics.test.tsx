import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { CONSENT_KEY, saveAnalyticsConsent } from "@/lib/analytics-consent";

const route = vi.hoisted(() => ({ pathname: "/", onReady: () => {} }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/script", () => ({
  default: ({ src, strategy, onReady }: { src: string; strategy: string; onReady: () => void }) => {
    route.onReady = onReady;
    return <div data-testid="google-script" data-src={src} data-strategy={strategy} />;
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "G-TEST123");
  localStorage.clear();
  route.pathname = "/";
  vi.stubGlobal("gtag", undefined);
  vi.stubGlobal("dataLayer", []);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Google Analytics consent", () => {
  it("initializes consent before config, disables advertising and avoids duplicate config", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    expect(screen.getByTestId("google-script")).toHaveAttribute("data-strategy", "lazyOnload");
    act(() => route.onReady());
    const queue = (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((command) =>
      Array.from(command),
    );
    expect(queue).toEqual([
      [
        "consent",
        "default",
        {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        },
      ],
      ["js", expect.any(Date)],
      [
        "config",
        "G-TEST123",
        {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        },
      ],
    ]);
    act(() => route.onReady());
    expect(
      (window as unknown as { dataLayer: IArguments[] }).dataLayer.filter(
        (command) => command[0] === "config",
      ),
    ).toHaveLength(1);
  });
  it("does not initialize a late script after withdrawal", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    const ready = route.onReady;
    act(() => saveAnalyticsConsent("rejected"));
    act(() => ready());
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([]);
  });
  it.each(["/admin", "/admin/settings", "/login"])("blocks accepted consent on %s", (pathname) => {
    route.pathname = pathname;
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
  });
  it("does not load before a choice or after rejection", () => {
    render(<GoogleAnalytics />);
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
    act(() => saveAnalyticsConsent("rejected"));
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_KEY)).toBe("rejected");
  });

  it("loads after acceptance and disables collection when consent is withdrawn", () => {
    render(<GoogleAnalytics />);
    act(() => saveAnalyticsConsent("accepted"));
    expect(screen.getByTestId("google-script")).toHaveAttribute(
      "data-src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
    );
    act(() => saveAnalyticsConsent("rejected"));
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
  });

  it("restores a saved acceptance", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    expect(screen.getByTestId("google-script")).toBeInTheDocument();
  });

  it("does not load without a configured ID", () => {
    vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "");
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
  });
});
