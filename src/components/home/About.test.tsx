import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { About } from "./About";
import { AboutBio } from "./AboutBio";

// Mock Reveal to render children directly
vi.mock("@/components/motion/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Keep reveal effects static and provide matchMedia for the motion hooks.
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

  it("shows impact metrics instead of repository counts and technology categories", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("Years of experience")).toBeInTheDocument();
    expect(screen.getByText("Less manual work")).toBeInTheDocument();
    expect(screen.getByText("Locations upgraded")).toBeInTheDocument();
    expect(screen.getByText("Team members led")).toBeInTheDocument();
    expect(screen.queryByText("Public repos")).not.toBeInTheDocument();
    expect(screen.queryByText("Windows & Linux")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub stars")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub followers")).not.toBeInTheDocument();
  });

  it("renders the documented outcomes independently of the GitHub stats", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("8+")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("1,600+")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("120+")).not.toBeInTheDocument();
  });

  it("renders the section with correct id", () => {
    const { container } = render(<About profile={mockProfile} />);
    expect(container.querySelector("#about")).toBeTruthy();
  });

  it("renders the section heading", () => {
    render(<About profile={mockProfile} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /infrastructure\s*and software/i }),
    ).toBeInTheDocument();
  });

  it("renders the eyebrow label", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});
