import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsPreferences } from "./AnalyticsPreferences";
import { useConsentInset, setConsentInset } from "@/lib/consent-inset";
import { CONSENT_KEY, PREFERENCES_EVENT } from "@/lib/analytics-consent";
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setConsentInset(0);
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
    expect(accept.className).toBe(reject.className);
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

it("preserves initial focus and ignores Escape until editing", async () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  render(<AnalyticsPreferences />);
  await screen.findByRole("region", { name: "Cookie preferences" });
  expect(document.activeElement).toBe(trigger);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
  expect(screen.getByRole("region", { name: "Cookie preferences" })).toBeVisible();
  trigger.remove();
});

it.each(["Escape", "Cancel", "Save analytics preferences", "Reject"])(
  "restores the footer focus after %s",
  async (action) => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const trigger = document.createElement("button");
    document.body.append(trigger);
    render(<AnalyticsPreferences />);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    act(() =>
      window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { opener: trigger } })),
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    expect(document.activeElement).toBe(checkbox);
    if (action === "Escape") fireEvent.keyDown(window, { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: action }));
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(document.activeElement).toBe(trigger);
    expect(localStorage.getItem(CONSENT_KEY)).toBe(action === "Reject" ? "rejected" : "accepted");
    trigger.remove();
  },
);

it("publishes local inset changes and clears them without touching html", async () => {
  let height = 120;
  let resize = () => {};
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height);

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const hook = renderHook(() => useConsentInset());
  render(<AnalyticsPreferences />);
  await screen.findByRole("region", { name: "Cookie preferences" });
  expect(hook.result.current).toBe(120);
  height = 180;
  act(() => resize());
  expect(hook.result.current).toBe(180);
  height = 200;
  act(() => window.dispatchEvent(new Event("resize")));
  expect(hook.result.current).toBe(200);
  expect(document.documentElement.style.getPropertyValue("--consent-inset")).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  expect(hook.result.current).toBe(0);
});
