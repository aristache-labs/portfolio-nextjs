import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { Hero } from "./Hero";

beforeEach(() => installMatchMedia());
afterEach(cleanup);

const profile = {
  name: "Cristache Adrian",
  roles: ["Full Stack Developer", "Flutter Developer"],
};

describe("Hero", () => {
  it("renders the headline as the h1", () => {
    render(<Hero profile={profile} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/technology, built with intention/i);
  });

  it("renders the hero tagline chip", () => {
    render(<Hero profile={profile} heroTagline="Building AI-native products" />);
    expect(screen.getByText(/building ai-native products/i)).toBeInTheDocument();
  });

  it("omits the chip without a hero tagline", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByText(/building ai-native products/i)).not.toBeInTheDocument();
  });

  it("renders the roles under the headline", () => {
    render(<Hero profile={profile} />);
    expect(screen.getByText(/full stack developer/i)).toBeInTheDocument();
  });

  it("renders Explore Projects and Get in Touch, and Sponsor only with sponsorUrl", () => {
    const { rerender } = render(<Hero profile={profile} />);
    expect(screen.getByRole("link", { name: /explore projects/i })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "#contact");
    expect(screen.queryByRole("link", { name: /sponsor/i })).not.toBeInTheDocument();
    rerender(<Hero profile={profile} sponsorUrl="https://github.com/sponsors/aristache-labs" />);
    expect(screen.getByRole("link", { name: /sponsor/i })).toBeInTheDocument();
  });

  it("renders a scroll cue and no avatar image", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/scroll to projects/i)).toHaveAttribute("href", "#projects");
  });
});
