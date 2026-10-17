import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { Contact, platformIcon } from "./Contact";
import type { SocialRow } from "./Contact";
import { Github, Linkedin, Instagram, Send, Mail, Globe } from "lucide-react";
import { XIcon } from "@/components/brand/XIcon";

// Mock framer-motion to avoid jsdom animation issues
vi.mock("framer-motion", () => {
  const motionProps = [
    "initial",
    "animate",
    "exit",
    "whileInView",
    "whileHover",
    "viewport",
    "transition",
  ];
  const passthrough = (tag: string) => {
    const MockMotionComponent = ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      for (const key of motionProps) delete props[key];
      const Comp = tag as "div";
      return <Comp {...props}>{children}</Comp>;
    };
    MockMotionComponent.displayName = `motion.${tag}`;
    return MockMotionComponent;
  };
  return {
    motion: {
      a: passthrough("a"),
      div: passthrough("div"),
      figure: passthrough("figure"),
      h2: passthrough("h2"),
      li: passthrough("li"),
      p: passthrough("p"),
    },
  };
});

// Mock Reveal to render children directly
vi.mock("@/components/motion/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Magnetic renders for real and reads matchMedia via useReducedMotion
beforeEach(() => installMatchMedia());

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

describe("platformIcon", () => {
  it("returns Github icon for github", () => expect(platformIcon("github")).toBe(Github));
  it("returns Linkedin icon for linkedin", () => expect(platformIcon("linkedin")).toBe(Linkedin));
  it("returns X icon for twitter", () => expect(platformIcon("twitter")).toBe(XIcon));
  it("returns X icon for x", () => expect(platformIcon("x")).toBe(XIcon));
  it("returns Instagram icon for instagram", () =>
    expect(platformIcon("instagram")).toBe(Instagram));
  it("returns Send icon for telegram", () => expect(platformIcon("telegram")).toBe(Send));
  it("returns Mail icon for email", () => expect(platformIcon("email")).toBe(Mail));
  it("returns Globe icon for unknown platform", () => expect(platformIcon("unknown")).toBe(Globe));
  it("is case-insensitive", () => expect(platformIcon("GitHub")).toBe(Github));
});

describe("Contact", () => {
  const email = "hello@example.com";

  it("renders the contact section with id='contact'", () => {
    const { container } = render(<Contact socials={mockSocials} email={email} />);
    expect(container.querySelector("#contact")).toBeTruthy();
  });

  it("renders a mailto link with the given email", () => {
    render(<Contact socials={mockSocials} email={email} />);
    const link = screen.getByRole("link", { name: new RegExp(email) });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe(`mailto:${email}`);
  });

  it("renders only the email and linkedin cards", () => {
    render(<Contact socials={mockSocials} email={email} />);
    expect(screen.getByLabelText("linkedin: aristache-labs")).toBeTruthy();
    expect(screen.queryByLabelText("github: aristache-labs")).toBeNull();
    expect(screen.queryByLabelText("twitter: aristache-labs")).toBeNull();
    expect(screen.queryByText(/other ways to connect/i)).toBeNull();
  });

  it("opens the linkedin card in a new tab", () => {
    render(<Contact socials={mockSocials} email={email} />);
    const linkedin = screen.getByLabelText("linkedin: aristache-labs");
    expect(linkedin.getAttribute("href")).toBe("https://linkedin.com/in/aristache-labs");
    expect(linkedin.getAttribute("target")).toBe("_blank");
    expect(linkedin.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the heading", () => {
    render(<Contact socials={mockSocials} email={email} />);
    expect(screen.getByRole("heading", { name: /conversation/i })).toBeTruthy();
  });

  it("omits the linkedin card when that profile is not configured", () => {
    render(
      <Contact socials={mockSocials.filter((s) => s.platform !== "linkedin")} email={email} />,
    );
    expect(screen.queryByLabelText(/linkedin/i)).toBeNull();
    expect(screen.getByRole("link", { name: new RegExp(email) })).toBeTruthy();
  });

  it("shows the support link only when a sponsor url is set", () => {
    const { rerender } = render(<Contact socials={mockSocials} email={email} />);
    expect(screen.queryByRole("link", { name: /support independent projects/i })).toBeNull();
    rerender(
      <Contact socials={mockSocials} email={email} sponsorUrl="https://example.com/sponsor" />,
    );
    const support = screen.getByRole("link", { name: /support independent projects/i });
    expect(support.getAttribute("href")).toBe("https://example.com/sponsor");
    expect(support.getAttribute("target")).toBe("_blank");
  });

  it("renders empty social list gracefully", () => {
    render(<Contact socials={[]} email={email} />);
    const link = screen.getByRole("link", { name: new RegExp(email) });
    expect(link).toBeTruthy();
  });
});
