import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { About } from "./About";
import { AboutBio } from "./AboutBio";

// Mock Reveal to render children directly
vi.mock("@/components/motion/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// AnimatedStat renders for real (count-up) — force reduced motion so it shows
// the final values synchronously, and provide matchMedia for the hook.
beforeEach(() => installMatchMedia({ "(prefers-reduced-motion: reduce)": true }));

const mockProfile = {
  bio: "I build fast, accessible web apps and love open source.",
  stats: { years: 4, repos: 120, stars: 250, followers: 87 },
};

describe("About", () => {
  it("expands and collapses the remaining mobile biography", () => {
    render(
      <AboutBio bio="I turn technical challenges into practical, dependable solutions. More about my work." />,
    );
    const toggle = screen.getByRole("button", { name: "View more" });
    const remainder = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(remainder).toHaveAttribute("hidden");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(remainder).not.toHaveAttribute("hidden");
    expect(remainder).toHaveTextContent("More about my work.");
    fireEvent.click(screen.getByRole("button", { name: "View less" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(remainder).toHaveAttribute("hidden");
  });
  it("renders the bio text", () => {
    render(<About profile={mockProfile} />);
    expect(
      screen.getAllByText("I build fast, accessible web apps and love open source."),
    ).toHaveLength(2);
  });

  it("renders stat labels", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("Years of experience")).toBeInTheDocument();
    expect(screen.getByText("Public repos")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Systems")).toBeInTheDocument();
    expect(screen.queryByText("GitHub stars")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub followers")).not.toBeInTheDocument();
  });

  it("renders the experience figure and a + suffix for 100 or more repos", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("8+")).toBeInTheDocument();
    expect(screen.getByText("120+")).toBeInTheDocument();
  });

  it("renders the section with correct id", () => {
    const { container } = render(<About profile={mockProfile} />);
    expect(container.querySelector("#about")).toBeTruthy();
  });

  it("renders the section heading", () => {
    render(<About profile={mockProfile} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /the mind\s*behind the code/i }),
    ).toBeInTheDocument();
  });

  it("renders the eyebrow label", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});
