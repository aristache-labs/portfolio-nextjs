import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import { afterEach, expect, it, vi } from "vitest";
import ScrollToTop from "./ScrollToTop";

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));

afterEach(() => {
  cleanup();
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
