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

  it("keeps the editorial groups in visible server HTML without duplicating the introduction", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <About
        profile={{
          ...mockProfile,
          bio: `${mockProfile.bio} More about my work.`,
          avatarUrl: "https://example.com/portrait.webp",
        }}
      />,
    );
    const biography = container.getElementsByClassName(styles.biography)[0];
    expect(biography.children).toHaveLength(3);
    for (const name of [styles.portrait, styles.heading, styles.introduction]) {
      const group = biography.getElementsByClassName(name)[0];
      expect(group.parentElement).toBe(biography);
      expect(group).not.toHaveAttribute("style");
    }
    expect(biography).toHaveTextContent(mockProfile.bio);
    expect(biography).toHaveTextContent("Behind the code.");
    const details = container.getElementsByClassName(styles.copy)[0];
    expect(details).not.toHaveTextContent(mockProfile.bio);
    expect(details).toHaveTextContent("More about my work.");
    expect(biography.contains(details)).toBe(false);
  });

  it("places the results after the detailed biography and outside the pinned scene", () => {
    const { container } = render(
      <About profile={{ ...mockProfile, bio: `${mockProfile.bio} More about my work.` }} />,
    );
    const results = container.getElementsByClassName(styles.results)[0];
    const details = container.getElementsByClassName(styles.copy)[0];
    const content = container.querySelector("#about > [data-scroll-anchor]")!;
    expect(content.lastElementChild).toBe(results);
    expect(
      details.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(results.closest('[class*="track"]')).toBeNull();
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
    const { container } = render(<About profile={mockProfile} />);
    expect(container.querySelector("#about")).toHaveTextContent(mockProfile.bio);
    expect(container.getElementsByClassName(styles.copy)).toHaveLength(0);
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
    for (const value of ["8+", "60%", "1,600+", "5"]) {
      const copies = screen.getAllByText(value);
      expect(copies.filter((node) => !node.closest('[aria-hidden="true"]'))).toHaveLength(1);
    }
    expect(screen.queryByText("120+")).not.toBeInTheDocument();
  });

  it("renders saved admin statistics as final server text", () => {
    const root = document.createElement("div");
    root.innerHTML = renderToString(
      <About
        profile={{
          ...mockProfile,
          stats: {
            manualWorkReduction: "73%",
            manualWorkReductionLabel: "Hours saved",
            deploymentLocations: "2,400+",
            teamSize: "",
            experienceYears: "9+",
          },
        }}
      />,
    );
    const results = root.getElementsByClassName(styles.results)[0];
    expect(results).toHaveTextContent("73%");
    expect(results).toHaveTextContent("2,400+");
    expect(results).toHaveTextContent("9+");
    expect(results).toHaveTextContent("Hours saved");
    expect(results).not.toHaveTextContent("Team members led");
    expect(results).not.toHaveTextContent("0%");
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
