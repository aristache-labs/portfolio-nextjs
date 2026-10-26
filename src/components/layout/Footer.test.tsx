import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { Footer } from "./Footer";
import type { SocialRow } from "@/components/home/Contact";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import layout from "./footer-layout.module.css";
import { MotionProvider } from "@/components/motion/MotionProvider";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockSocials: SocialRow[] = [
  {
    platform: "github",
    url: "https://github.com/aristache-labs",
    username: "aristache-labs",
    order: 1,
  },
  {
    platform: "linkedin",
    url: "https://linkedin.com/in/aristache-labs",
    username: "aristache-labs",
    order: 2,
  },
  {
    platform: "twitter",
    url: "https://twitter.com/aristache-labs",
    username: "aristache-labs",
    order: 3,
  },
];

describe("Footer", () => {
  beforeEach(() => installMatchMedia());
  afterEach(() => vi.restoreAllMocks());

  it.each(["", "/"])("filters Explore links by visibility with prefix %s", (prefix) => {
    const { container, rerender } = render(
      <Footer
        socials={[]}
        homeHrefPrefix={prefix}
        sectionVisibility={{ services: false, projects: true, hero: false }}
      />,
    );
    const nav = () => container.querySelector('nav[aria-label="Explore"]')!;
    expect(nav().querySelector(`a[href="${prefix}#services"]`)).toBeNull();
    for (const id of ["hero", "projects", "about"]) {
      expect(nav().querySelector(`a[href="${prefix}#${id}"]`)).not.toBeNull();
    }
    rerender(
      <Footer socials={[]} homeHrefPrefix={prefix} sectionVisibility={{ services: true }} />,
    );
    expect(nav().querySelector(`a[href="${prefix}#services"]`)).not.toBeNull();
  });

  it("serves visible copy and navigation without waiting for hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Footer socials={mockSocials} />);
    expect(container.querySelector('nav[aria-label="Explore"]')).not.toBeNull();
    for (const element of container.querySelectorAll("h2, h3, p, a, img")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
  });

  it("keeps the logo visible when the footer is already on screen", () => {
    const { container } = render(<Footer socials={mockSocials} />);
    const image = container.querySelector('img[src="/brand/logo.svg"]');
    expect(image).not.toBeNull();
    for (let node = image; node; node = node.parentElement) {
      expect((node as HTMLElement).style.opacity).toBe("");
      expect((node as HTMLElement).style.transform).toBe("");
    }
  });

  it.each([
    [1440, 900, true],
    [390, 844, false],
    [844, 390, false],
  ])("animates footer groups and navigation once at %sx%s", async (width, height, desktop) => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal("innerHeight", height);
    const observed = new Map<Element, IntersectionObserverCallback>();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(node: Element) {
          observed.set(node, this.callback);
        }
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 2000,
      left: 0,
    } as DOMRect);
    const { container, unmount } = render(
      <MotionProvider>
        <Footer socials={mockSocials} sponsorUrl="https://example.com/support" />
      </MotionProvider>,
    );
    try {
      const groups = [layout.identity, layout.legal].map(
        (className) => container.getElementsByClassName(className)[0] as HTMLElement,
      );
      const nav = screen.getByRole("navigation", { name: "Explore" });
      groups.push(
        nav.parentElement!,
        screen.getByRole("link", { name: /send a message/i }).parentElement!,
      );
      await waitFor(() => {
        for (const group of groups) expect(group).toHaveStyle({ opacity: "0" });
      });
      const enter = (node: Element) =>
        observed.get(node)!(
          [
            {
              target: node,
              isIntersecting: true,
              boundingClientRect: { top: 100, bottom: 300 },
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      act(() => {
        groups.forEach(enter);
      });
      await waitFor(
        () => {
          for (const group of groups)
            expect(group).toHaveStyle({ opacity: "1", transform: "none" });
          for (const item of nav.querySelectorAll("li"))
            expect(item).toHaveStyle({ opacity: "1", transform: "none" });
        },
        { timeout: 2200 },
      );
      act(() => {
        groups.forEach(enter);
        window.dispatchEvent(new Event("resize"));
      });
      for (const group of groups) expect(group).toHaveStyle({ opacity: "1", transform: "none" });
      expect(screen.getByRole("link", { name: "Support" })).toBeVisible();
    } finally {
      unmount();
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it("preserves direct-child layout rules for the mobile CTA and legal row", () => {
    const { container } = render(<Footer socials={mockSocials} />);
    expect(screen.getByRole("link", { name: /send a message/i }).parentElement).toHaveClass(
      layout.contact,
    );
    expect(container.getElementsByClassName(layout.legal)[0].lastElementChild?.tagName).toBe("P");
  });

  it("preserves cross-page anchor URLs on secondary routes", () => {
    render(<Footer socials={mockSocials} homeHrefPrefix="/" />);
    const navigation = screen.getByRole("navigation", { name: "Explore" });
    expect(within(navigation).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/#hero",
    );
    expect(within(navigation).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/#projects",
    );
    expect(screen.getByRole("link", { name: /send a message/i })).toHaveAttribute(
      "href",
      "/#contact",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  it("keeps the footer static with reduced motion", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    const { container } = render(<Footer socials={mockSocials} />);
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeVisible();
  });

  it("reveals the navigation immediately when keyboard focus reaches an offscreen link", async () => {
    const originalObserver = globalThis.IntersectionObserver;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 2000,
    } as DOMRect);
    const { unmount } = render(
      <MotionProvider>
        <Footer socials={mockSocials} />
      </MotionProvider>,
    );
    try {
      const navigation = screen.getByRole("navigation", { name: "Explore" });
      await waitFor(() => expect(navigation.parentElement).toHaveStyle({ opacity: "0" }));
      act(() => within(navigation).getByRole("link", { name: "Home" }).focus());
      await waitFor(() => expect(navigation.parentElement).toHaveStyle({ opacity: "1" }));
      for (const item of navigation.querySelectorAll("li"))
        expect(item).toHaveStyle({ opacity: "1" });
    } finally {
      unmount();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    }
  });

  it("renders the footer element", () => {
    const { container } = render(<Footer socials={mockSocials} />);
    expect(container.querySelector("footer")).toBeTruthy();
  });

  it("renders the brand logo", () => {
    const { container } = render(<Footer socials={mockSocials} />);
    expect(container.querySelector('img[src="/brand/logo.svg"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: /aristache, back to top/i })).toBeTruthy();
  });

  it("does not render the social icon group", () => {
    render(<Footer socials={mockSocials} email="hi@example.com" />);
    expect(screen.queryByLabelText("github")).toBeNull();
    expect(screen.queryByLabelText("linkedin")).toBeNull();
    expect(screen.queryByLabelText("twitter")).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("renders professional positioning and copyright", () => {
    render(<Footer socials={mockSocials} heroTagline="Diagnose * Build * Automate" />);
    expect(screen.getByText("Diagnose * Build * Automate")).toBeTruthy();
    expect(screen.getByText(/All rights reserved/)).toBeTruthy();
  });

  it("renders dynamic copyright year", () => {
    render(<Footer socials={mockSocials} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeTruthy();
  });

  it("renders three columns: Explore and Let's Connect, no Other Places", () => {
    render(<Footer socials={mockSocials} />);
    expect(screen.getByRole("heading", { name: "Explore" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /let's connect/i })).toBeTruthy();
    expect(screen.queryByText("Other Places")).toBeNull();
    expect(screen.getByRole("link", { name: /send a message/i }).getAttribute("href")).toBe(
      "#contact",
    );
  });

  it("keeps contact primary and shows only a small support link when configured", () => {
    const { rerender } = render(<Footer socials={mockSocials} />);
    expect(screen.queryByRole("link", { name: "Support" })).toBeNull();
    rerender(<Footer socials={mockSocials} sponsorUrl="https://example.com/sponsor" />);
    const support = screen.getByRole("link", { name: "Support" });
    expect(support.getAttribute("href")).toBe("https://example.com/sponsor");
    expect(support.getAttribute("target")).toBe("_blank");
    expect(screen.queryByText("Fuel Future Projects")).not.toBeInTheDocument();
    expect(screen.queryByText("Support My Work")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send a message/i })).toHaveAttribute(
      "href",
      "#contact",
    );
    expect(screen.getByRole("link", { name: "Contact" }).getAttribute("href")).toBe("#contact");
  });

  it("renders empty socials gracefully", () => {
    render(<Footer socials={[]} />);
    expect(screen.getByRole("link", { name: /aristache, back to top/i })).toBeTruthy();
  });
});
