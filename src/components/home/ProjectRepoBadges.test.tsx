import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProjectRepoBadges } from "./ProjectRepoBadges";

describe("ProjectRepoBadges", () => {
  it("uses the selected project for both Shields images and GitHub links", () => {
    render(<ProjectRepoBadges repo="MiVue-Pro" />);
    const badge = screen.getByAltText("GitHub contributors");
    const url = new URL(badge.getAttribute("src")!);
    expect(url.pathname).toBe("/github/contributors/aristache-labs/MiVue-Pro");
    expect(url.searchParams.get("color")).toBe("0f6e68");
    expect(screen.getAllByRole("img")).toHaveLength(2);
    const starsUrl = new URL(screen.getByAltText("GitHub stars").getAttribute("src")!);
    expect(starsUrl.pathname).toBe("/github/stars/aristache-labs/MiVue-Pro");
    expect(screen.getByRole("link", { name: "GitHub stars for MiVue-Pro" })).toHaveAttribute(
      "href",
      "https://github.com/aristache-labs/MiVue-Pro/stargazers",
    );
  });

  it("keeps a usable link if a badge image cannot load", () => {
    render(<ProjectRepoBadges repo="portfolio-nextjs" />);
    fireEvent.error(screen.getByAltText("GitHub contributors"));
    expect(screen.getByText("Contributors")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "GitHub contributors for portfolio-nextjs" }),
    ).toBeInTheDocument();
  });
});
