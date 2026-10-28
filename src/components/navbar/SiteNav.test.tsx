import { act, render, screen, cleanup, fireEvent } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { usePathname } from "next/navigation";
import { installMatchMedia } from "@/test/matchMedia";
import { SiteNav } from "./SiteNav";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    scroll,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean; scroll?: boolean }) => (
    <a {...props} data-prefetch={prefetch === false ? "false" : undefined} data-scroll={scroll} />
  ),
}));

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/");
  installMatchMedia({ "(prefers-reduced-motion: reduce)": true });
});
afterEach(cleanup);

const socials = [
  { platform: "GitHub", url: "https://github.com/aristache-labs" },
  { platform: "LinkedIn", url: "https://linkedin.com/in/aristache-labs" },
];

describe("SiteNav", () => {
  it("preloads the same responsive wordmark candidates it renders in server HTML", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<SiteNav socials={socials} />);
    const image = container.querySelector('img[src="/brand/aristache-text.webp"]')!;
    const candidates = image.getAttribute("srcset");
    expect(candidates).toBe(
      "/brand/aristache-text-224.webp 224w, /brand/aristache-text-448.webp 448w, /brand/aristache-text.webp 704w",
    );
    expect(image).toHaveAttribute("width", "704");
    expect(image).toHaveAttribute("height", "124");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).not.toHaveAttribute("loading", "lazy");
    expect(image.getAttribute("sizes")).toContain("min(42vw, 224px)");
    expect(image.getAttribute("sizes")).toContain("min(38vw, 137.5px)");
    const preloads = container.querySelectorAll('link[rel="preload"][as="image"]');
    const wordmarkPreloads = [...preloads].filter((link) =>
      link.getAttribute("imagesrcset")?.includes("aristache-text"),
    );
    expect(wordmarkPreloads).toHaveLength(1);
    expect(wordmarkPreloads[0]).toHaveAttribute("imagesrcset", candidates);
    expect(wordmarkPreloads[0]).toHaveAttribute("imagesizes", image.getAttribute("sizes"));
    expect(wordmarkPreloads[0]).toHaveAttribute("fetchpriority", "high");
    expect(container.querySelectorAll('img[src="/brand/aristache-text.webp"]')).toHaveLength(1);
  });

  it("disables prefetch for the homepage logo, desktop links, mobile links and CTAs", () => {
    const { container } = render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const anchors = container.querySelectorAll('a[href^="#"]');
    expect(anchors).toHaveLength(17);
    anchors.forEach((anchor) => expect(anchor).toHaveAttribute("data-prefetch", "false"));
  });

  it.each(["/privacy", "/gdpr"])("preserves native section navigation from %s", (pathname) => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    const { container } = render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const anchors = container.querySelectorAll('a[href^="/#"]');
    expect(anchors).toHaveLength(17);
    anchors.forEach((anchor) => expect(anchor).not.toHaveAttribute("data-prefetch"));
  });

  it("hydrates rewritten homepage links without replacing the server navigation", async () => {
    vi.mocked(usePathname).mockReturnValue("/index");
    const container = document.createElement("div");
    container.innerHTML = renderToString(<SiteNav socials={socials} />);
    document.body.append(container);
    const serverNavigation = container.querySelector("nav");
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;

    try {
      expect(container.querySelector('a[aria-label="Home"]')).toHaveAttribute("href", "/#hero");
      vi.mocked(usePathname).mockReturnValue("/");
      await act(async () => {
        root = hydrateRoot(container, <SiteNav socials={socials} />, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(container.querySelector("nav")).toBe(serverNavigation);
      expect(container.querySelector('a[aria-label="Home"]')).toHaveAttribute("href", "#hero");
    } finally {
      await act(async () => root?.unmount());
      consoleError.mockRestore();
      container.remove();
    }
  });

  it("links back to homepage sections from Privacy without marking Home active", () => {
    vi.mocked(usePathname).mockReturnValue("/privacy");
    render(<SiteNav socials={socials} />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const links = screen.getAllByTestId("mobile-section-link");
    expect(links[0]).toHaveAttribute("href", "/#hero");
    expect(links[1]).toHaveAttribute("href", "/#about");
    links.forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
  });
  it("renders the home link, inline sections, and connect CTA", () => {
    render(<SiteNav socials={socials} />);
    expect(screen.getAllByRole("link", { name: /^home$/i })[0]).toHaveAttribute("href", "#hero");
    expect(document.querySelector('img[src="/brand/aristache-text.webp"]')).toBeInTheDocument();
    expect(screen.queryByText("Cristache Adrian")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");
    expect(screen.getAllByRole("link", { name: /let's talk/i })[0]).toHaveAttribute(
      "href",
      "#contact",
    );
    expect(screen.queryByRole("link", { name: "FAQ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Testimonials" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /appearance settings/i })).not.toBeInTheDocument();
  });

  it("omits a hidden section", () => {
    render(<SiteNav socials={socials} hidden={["skills"]} />);
    expect(screen.queryByRole("link", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });

  it("makes contact the primary action on desktop and mobile", () => {
    render(<SiteNav socials={socials} />);
    expect(screen.getByRole("link", { name: "Let's Talk" })).toHaveAttribute("href", "#contact");
    expect(screen.queryByRole("link", { name: "Support My Work" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getAllByRole("link", { name: "Let's Talk" })).toHaveLength(2);
  });

  it("omits the CTA when contact is hidden", () => {
    render(<SiteNav socials={socials} hidden={["contact"]} />);
    expect(screen.queryByRole("link", { name: "Let's Talk" })).not.toBeInTheDocument();
  });

  it("opens the mobile panel with section links and no socials", () => {
    render(<SiteNav socials={socials} />);
    expect(screen.queryByTestId("mobile-section-link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getAllByTestId("mobile-section-link")).toHaveLength(7);
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "LinkedIn" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes on Escape", () => {
    render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("mobile-section-link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: /open menu/i })).toHaveFocus();
  });

  it("locks page scrolling only while the mobile menu is open", () => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "auto";
    const { unmount } = render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("auto");
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    unmount();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = previous;
  });

  it("closes when a mobile section link is chosen", () => {
    render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.click(screen.getAllByTestId("mobile-section-link")[1]);
    expect(screen.queryByTestId("mobile-section-link")).not.toBeInTheDocument();
  });
});
