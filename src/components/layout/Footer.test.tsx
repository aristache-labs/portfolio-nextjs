import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { Footer } from "./Footer";
import type { SocialRow } from "@/components/home/Contact";

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

// Mock framer-motion to avoid jsdom animation issues
vi.mock("framer-motion", () => {
  const motionProps = ["initial", "animate", "whileInView", "viewport", "transition"];
  const passthrough = (tag: string) => {
    function Passthrough({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) {
      for (const key of motionProps) delete props[key];
      const Comp = tag as "div";
      return <Comp {...props}>{children}</Comp>;
    }
    return Passthrough;
  };
  return {
    motion: {
      div: passthrough("div"),
      nav: passthrough("nav"),
      h2: passthrough("h2"),
      p: passthrough("p"),
      span: passthrough("span"),
    },
  };
});

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

  it("renders the footer element", () => {
    const { container } = render(<Footer socials={mockSocials} />);
    expect(container.querySelector("footer")).toBeTruthy();
  });

  it("renders the Logo (icon only, no wordmark text)", () => {
    render(<Footer socials={mockSocials} />);
    // Wordmark text removed per design; the logo mark exposes an accessible label.
    expect(screen.queryByText("aristache")).toBeNull();
    expect(screen.getByRole("img", { name: /aristache/i })).toBeTruthy();
  });

  it("does not render the social icon group", () => {
    render(<Footer socials={mockSocials} email="hi@example.com" />);
    expect(screen.queryByLabelText("github")).toBeNull();
    expect(screen.queryByLabelText("linkedin")).toBeNull();
    expect(screen.queryByLabelText("twitter")).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.getByText(/Diagnose. Build. Automate./)).toBeTruthy();
  });

  it("renders the sign-off and copyright line", () => {
    render(<Footer socials={mockSocials} />);
    expect(screen.getByText(/Diagnose. Build. Automate./)).toBeTruthy();
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

  it("shows Fuel Future Projects only when a sponsor url is set", () => {
    const { rerender } = render(<Footer socials={mockSocials} />);
    expect(screen.queryByRole("link", { name: /fuel future projects/i })).toBeNull();
    rerender(<Footer socials={mockSocials} sponsorUrl="https://example.com/sponsor" />);
    const support = screen.getByRole("link", { name: /fuel future projects/i });
    expect(support.getAttribute("href")).toBe("https://example.com/sponsor");
    expect(support.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: /send a message/i }).getAttribute("href")).toBe(
      "#contact",
    );
  });

  it("renders empty socials gracefully", () => {
    render(<Footer socials={[]} />);
    expect(screen.getByText(/Diagnose. Build. Automate./)).toBeTruthy();
  });
});
