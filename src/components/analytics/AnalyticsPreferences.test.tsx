import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsPreferences } from "./AnalyticsPreferences";
import { CONSENT_KEY, PREFERENCES_EVENT } from "@/lib/analytics-consent";
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

beforeEach(() => {
  route.pathname = "/";
  localStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "G-TEST123");
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("cookie preferences", () => {
  it.each(["/admin", "/admin/settings", "/login"])("stays hidden on %s", async (pathname) => {
    route.pathname = pathname;
    render(<AnalyticsPreferences />);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(screen.queryByRole("region", { name: "Cookie preferences" })).toBeNull();
  });
  it("does not show without a measurement ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GTAG_ID", "");
    render(<AnalyticsPreferences />);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(screen.queryByRole("region", { name: "Cookie preferences" })).toBeNull();
  });
  it("offers accept and reject side by side and unchecked optional analytics", async () => {
    render(<AnalyticsPreferences />);
    await screen.findByRole("region", { name: "Cookie preferences" });
    const accept = screen.getByRole("button", { name: "Accept" });
    const reject = screen.getByRole("button", { name: "Reject" });
    expect(reject.parentElement).toBe(accept.parentElement);
    // Reject keeps the base action styling; Accept only adds the brand fill on top of it.
    expect(accept.className.startsWith(reject.className)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save analytics preferences" }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("rejected");
    expect(screen.queryByRole("region", { name: "Cookie preferences" })).toBeNull();
  });
  it("reopens a stored choice from the footer and allows withdrawal", async () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<AnalyticsPreferences />);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(screen.queryByRole("region", { name: "Cookie preferences" })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event(PREFERENCES_EVENT));
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("rejected");
  });
});
