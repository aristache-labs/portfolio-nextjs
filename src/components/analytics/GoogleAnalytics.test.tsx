import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { CONSENT_KEY, saveAnalyticsConsent } from "@/lib/analytics-consent";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => <div data-testid="google-script" data-src={src} />,
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "G-TEST123");
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("Google Analytics consent", () => {
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
