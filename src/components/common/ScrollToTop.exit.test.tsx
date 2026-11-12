import { act, cleanup, render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setConsentInset } from "@/lib/consent-inset";
import { setMobileMenuOpen } from "@/lib/mobile-menu-state";
import ScrollToTop from "./ScrollToTop";

// With motion allowed, the button plays Puff Out on its way out instead of vanishing at once.
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => false }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
});

afterEach(() => {
  cleanup();
  setConsentInset(0);
  setMobileMenuOpen(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("holds the button for the whole Puff Out, then removes it", () => {
  render(
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
    </LazyMotion>,
  );
  const button = screen.getByRole("button", { name: "Scroll to top" });
  expect(button).not.toHaveAttribute("data-leaving");

  act(() => setMobileMenuOpen(true));
  // Still mounted and marked as leaving: the CSS animation owns the exit.
  const leaving = screen.getByRole("button", { name: "Scroll to top" });
  expect(leaving).toHaveAttribute("data-leaving");
  act(() => {
    vi.advanceTimersByTime(599);
  });
  expect(screen.queryByRole("button", { name: "Scroll to top" })).not.toBeNull();
  act(() => {
    vi.advanceTimersByTime(2);
  });
  expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();
});
