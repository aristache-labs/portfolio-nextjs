import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import { afterEach, expect, it, vi } from "vitest";
import { setConsentInset } from "@/lib/consent-inset";
import ScrollToTop from "./ScrollToTop";
import { setMobileMenuOpen } from "@/lib/mobile-menu-state";

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));

afterEach(() => {
  cleanup();
  setConsentInset(0);
  setMobileMenuOpen(false);
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

it.each(["about", "skills", "experience", "projects", "contact"])(
  "appears at the start of %s and remeasures after resize",
  async (id) => {
    const section = document.createElement("section");
    section.id = id;
    document.body.append(section);
    let top = 200;
    vi.spyOn(section, "getBoundingClientRect").mockImplementation(
      () => ({ top, bottom: top + 1500 }) as DOMRect,
    );
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    render(
      <LazyMotion features={domAnimation}>
        <ScrollToTop />
      </LazyMotion>,
    );
    expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();
    top = 0;
    fireEvent.resize(window);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Scroll to top" })).toBeVisible(),
    );
    act(() => setMobileMenuOpen(true));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull());
    act(() => setMobileMenuOpen(false));
    expect(screen.getByRole("button", { name: "Scroll to top" })).toBeVisible();
    section.remove();
  },
);

it("uses About before later sections even while their bottoms remain below the viewport", () => {
  const sections = ["about", "experience", "projects"].map((id, i) => {
    const section = document.createElement("section");
    section.id = id;
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: i * 1000,
      bottom: (i + 1) * 1000,
    } as DOMRect);
    document.body.append(section);
    return section;
  });
  vi.spyOn(window, "scrollY", "get").mockReturnValue(900);
  render(
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
    </LazyMotion>,
  );
  expect(screen.getByRole("button", { name: "Scroll to top" })).toBeVisible();
  sections.forEach((section) => section.remove());
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
  expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
});

it("hides while a consent prompt is visible and returns after it closes", () => {
  vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
  setConsentInset(180);
  render(
    <LazyMotion features={domAnimation}>
      <ScrollToTop />
    </LazyMotion>,
  );
  expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();
  act(() => setConsentInset(0));
  expect(screen.getByRole("button", { name: "Scroll to top" })).toBeVisible();
});
