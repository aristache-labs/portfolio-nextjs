import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { StrictMode } from "react";
import { CONSENT_KEY, saveAnalyticsConsent, useAnalyticsConsent } from "@/lib/analytics-consent";

const route = vi.hoisted(() => ({ pathname: "/", onReady: () => {} }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/script", () => ({
  default: ({ src, strategy, onReady }: { src: string; strategy: string; onReady: () => void }) => {
    route.onReady = onReady;
    return <div data-testid="google-script" data-src={src} data-strategy={strategy} />;
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "G-TEST123");
  localStorage.clear();
  route.pathname = "/";
  route.onReady = () => {};
  window.history.replaceState(null, "", "/");
  document.title = "Portfolio";
  vi.stubGlobal("gtag", undefined);
  vi.stubGlobal("dataLayer", []);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

function commands() {
  return (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((command) =>
    Array.from(command),
  );
}

function pageViews() {
  return commands().filter((command) => command[0] === "event" && command[1] === "page_view");
}

function flushPageView() {
  act(() => {
    vi.advanceTimersToNextFrame();
    vi.runOnlyPendingTimers();
  });
}

function visit(path: string) {
  window.history.replaceState(null, "", path);
  route.pathname = window.location.pathname;
}

function ConsentReaders() {
  useAnalyticsConsent();
  useAnalyticsConsent();
  return null;
}

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
          allow_google_signals: false,
          send_page_view: false,
          allow_ad_personalization_signals: false,
        },
      ],
    ]);
    flushPageView();
    expect(pageViews()).toEqual([
      ["event", "page_view", { page_location: window.location.href, page_title: "Portfolio" }],
    ]);
    act(() => route.onReady());
    flushPageView();
    expect(pageViews()).toHaveLength(1);
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
    visit(pathname);
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

describe("manual page views", () => {
  it("waits for initialization and uses the current title after pathname navigation", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const view = render(<GoogleAnalytics />);
    flushPageView();
    expect(pageViews()).toHaveLength(0);
    act(() => route.onReady());
    flushPageView();
    visit("/privacy");
    view.rerender(<GoogleAnalytics />);
    document.title = "Privacy | Portfolio";
    flushPageView();
    expect(pageViews()).toEqual([
      [
        "event",
        "page_view",
        { page_location: new URL("/", window.location.origin).href, page_title: "Portfolio" },
      ],
      [
        "event",
        "page_view",
        { page_location: window.location.href, page_title: "Privacy | Portfolio" },
      ],
    ]);
    visit("/");
    view.rerender(<GoogleAnalytics />);
    flushPageView();
    expect(pageViews()).toHaveLength(3);
  });

  it("deduplicates Strict Mode, repeated readiness, rerenders and hash-only changes", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const view = render(
      <StrictMode>
        <GoogleAnalytics />
      </StrictMode>,
    );
    act(() => {
      route.onReady();
      route.onReady();
    });
    flushPageView();
    visit("/#about");
    view.rerender(
      <StrictMode>
        <GoogleAnalytics />
      </StrictMode>,
    );
    act(() => route.onReady());
    flushPageView();
    expect(pageViews()).toHaveLength(1);
    expect(commands().filter((command) => command[0] === "config")).toHaveLength(1);
  });

  it.each(["/admin", "/admin/settings", "/login"])(
    "cancels queued views on navigation to %s",
    (path) => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      const view = render(<GoogleAnalytics />);
      act(() => route.onReady());
      visit(path);
      view.rerender(<GoogleAnalytics />);
      flushPageView();
      expect(pageViews()).toHaveLength(0);
      expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
      visit("/privacy");
      view.rerender(<GoogleAnalytics />);
      flushPageView();
      expect(pageViews()).toHaveLength(1);
    },
  );

  it("drops stale callbacks and only measures the latest public route", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const view = render(<GoogleAnalytics />);
    act(() => route.onReady());
    visit("/privacy");
    view.rerender(<GoogleAnalytics />);
    visit("/gdpr");
    view.rerender(<GoogleAnalytics />);
    document.title = "GDPR | Portfolio";
    flushPageView();
    expect(pageViews()).toEqual([
      ["event", "page_view", { page_location: window.location.href, page_title: document.title }],
    ]);
  });

  it("rechecks the real location before sending even before React observes navigation", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    act(() => route.onReady());
    window.history.replaceState(null, "", "/login");
    flushPageView();
    expect(pageViews()).toHaveLength(0);
  });

  it("cancels a timer when consent is withdrawn after the animation frame", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    act(() => route.onReady());
    act(() => vi.advanceTimersToNextFrame());
    act(() => saveAnalyticsConsent("rejected"));
    flushPageView();
    expect(pageViews()).toHaveLength(0);
  });

  it("cancels queued measurement on unmount", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const view = render(<GoogleAnalytics />);
    act(() => route.onReady());
    view.unmount();
    flushPageView();
    expect(pageViews()).toHaveLength(0);
  });

  it("sends one new page view when the same page is accepted again without reconfiguration", () => {
    render(
      <>
        <GoogleAnalytics />
        <ConsentReaders />
      </>,
    );
    act(() => saveAnalyticsConsent("accepted"));
    act(() => route.onReady());
    flushPageView();
    expect(pageViews()).toHaveLength(1);
    act(() => saveAnalyticsConsent("rejected"));
    flushPageView();
    expect(pageViews()).toHaveLength(1);
    act(() => saveAnalyticsConsent("accepted"));
    act(() => route.onReady());
    flushPageView();
    expect(pageViews()).toHaveLength(2);
    expect(commands().filter((command) => command[0] === "config")).toHaveLength(1);
    expect(
      commands().filter((command) => command[0] === "consent" && command[1] === "update"),
    ).toHaveLength(2);
  });

  it("handles Reject and Accept batched before React rerenders", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<GoogleAnalytics />);
    act(() => route.onReady());
    flushPageView();
    act(() => {
      saveAnalyticsConsent("rejected");
      saveAnalyticsConsent("accepted");
    });
    flushPageView();
    expect(pageViews()).toHaveLength(2);
  });
});
