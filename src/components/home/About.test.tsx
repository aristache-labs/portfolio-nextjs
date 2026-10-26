import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { About } from "./About";
import { AboutBio } from "./AboutBio";
import styles from "./about-stats.module.css";

// Keep reveal effects static and provide matchMedia for the motion hooks.
beforeEach(() => installMatchMedia({ "(prefers-reduced-motion: reduce)": true }));

const mockProfile = {
  bio: "I build fast, accessible web apps and love open source.",
  stats: { years: 4, repos: 120, stars: 250, followers: 87 },
};

describe("About", () => {
  it("keeps the portrait visible and in its layout position with reduced motion", () => {
    const { container } = render(
      <About profile={{ ...mockProfile, avatarUrl: "https://example.com/portrait.webp" }} />,
    );
    const portrait = container.getElementsByClassName(styles.portrait)[0];
    expect(portrait).not.toHaveStyle({ opacity: "0" });
    expect(portrait.parentElement).toHaveClass(styles.biography);
    expect(portrait.parentElement).not.toHaveAttribute("style");
  });

  it("keeps portrait, heading and copy as direct layout children in visible server HTML", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <About profile={{ ...mockProfile, avatarUrl: "https://example.com/portrait.webp" }} />,
    );
    const biography = container.getElementsByClassName(styles.biography)[0];
    expect(biography.children).toHaveLength(3);
    for (const name of [styles.portrait, styles.heading, styles.copy]) {
      const group = biography.getElementsByClassName(name)[0];
      expect(group.parentElement).toBe(biography);
      expect(group).not.toHaveAttribute("style");
    }
    expect(biography).toHaveTextContent(mockProfile.bio);
    expect(biography).toHaveTextContent("Behind the code.");
  });

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
      screen.getByRole("heading", { level: 2, name: /Behind\s+the\s+code\./i }),
    ).toBeInTheDocument();
  });

  it("renders the eyebrow label", () => {
    render(<About profile={mockProfile} />);
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});
