import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { SiteNav } from "./SiteNav";

beforeEach(() => installMatchMedia({ "(prefers-reduced-motion: reduce)": true }));
afterEach(cleanup);

const socials = [
  { platform: "GitHub", url: "https://github.com/aristache-labs" },
  { platform: "LinkedIn", url: "https://linkedin.com/in/aristache-labs" },
];

describe("SiteNav", () => {
  it("renders the home link, inline sections, and connect CTA", () => {
    render(<SiteNav socials={socials} />);
    expect(screen.getAllByRole("link", { name: /^home$/i })[0]).toHaveAttribute("href", "#hero");
    expect(document.querySelector('img[src="/brand/aristache-text.svg"]')).toBeInTheDocument();
    expect(screen.queryByText("Cristache Adrian")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");
    expect(screen.getAllByRole("link", { name: /let's connect/i })[0]).toHaveAttribute(
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

  it("uses Support My Work when a sponsor url is set, otherwise Let's Connect", () => {
    const { rerender } = render(<SiteNav socials={socials} />);
    expect(screen.getAllByRole("link", { name: /let's connect/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /support my work/i })).not.toBeInTheDocument();
    rerender(<SiteNav socials={socials} sponsorUrl="https://example.com/sponsor" />);
    const support = screen.getAllByRole("link", { name: /support my work/i });
    expect(support.length).toBeGreaterThan(0);
    for (const link of support) {
      expect(link).toHaveAttribute("href", "https://example.com/sponsor");
      expect(link).toHaveAttribute("target", "_blank");
    }
    expect(screen.queryByRole("link", { name: /let's connect/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getAllByRole("link", { name: /support my work/i })).toHaveLength(2);
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
  });

  it("closes when a mobile section link is chosen", () => {
    render(<SiteNav socials={socials} />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.click(screen.getAllByTestId("mobile-section-link")[1]);
    expect(screen.queryByTestId("mobile-section-link")).not.toBeInTheDocument();
  });
});
