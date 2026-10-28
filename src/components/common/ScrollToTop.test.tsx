import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import { afterEach, expect, it, vi } from "vitest";
import { setConsentInset } from "@/lib/consent-inset";
import ScrollToTop from "./ScrollToTop";

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));

afterEach(() => {
  cleanup();
  setConsentInset(0);
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

it.each(["/", "/privacy"])("clears the old hash on %s while preserving the query", (path) => {
  window.history.replaceState({ __NA: true }, "", `${path}?preview=1#contact`);
  vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const replace = vi.spyOn(window.history, "replaceState");
  render(
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
    </LazyMotion>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Scroll to top" }));

  expect(window.location.pathname + window.location.search + window.location.hash).toBe(
    `${path}?preview=1`,
  );
  expect(replace).toHaveBeenCalledWith(
    null,
    "",
    new URL(`${path}?preview=1`, window.location.origin),
  );
  expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
});

it("reads an earlier inset and updates only its own button", () => {
  vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
  setConsentInset(180);
  render(
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
    </LazyMotion>,
  );
  const button = screen.getByRole("button", { name: "Scroll to top" });
  expect(button.style.getPropertyValue("--consent-inset")).toBe("180px");
  expect(document.documentElement.style.getPropertyValue("--consent-inset")).toBe("");
  act(() => setConsentInset(220));
  expect(button.style.getPropertyValue("--consent-inset")).toBe("220px");
  act(() => setConsentInset(0));
  expect(button.style.getPropertyValue("--consent-inset")).toBe("0px");
});
