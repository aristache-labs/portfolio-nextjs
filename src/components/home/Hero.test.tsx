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
  it("does not mount a background video on a landscape phone", () => {
    installMatchMedia({ "(min-width: 768px)": true, "(pointer: coarse)": true });
    const { container } = render(<Hero profile={profile} />);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("button", { name: /background video/i })).not.toBeInTheDocument();
  });
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

  it("renders Explore Projects, Get in Touch, and Resume, with no sponsor action", () => {
    const { rerender } = render(<Hero profile={profile} />);
    expect(screen.getByRole("link", { name: /explore projects/i })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute("href", "#contact");
    expect(screen.queryByRole("link", { name: /^resume$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /support my work/i })).not.toBeInTheDocument();
    rerender(<Hero profile={profile} resumeUrl="https://example.com/cv.pdf" />);
    const resume = screen.getByRole("link", { name: /^resume$/i });
    expect(resume).toHaveAttribute("href", "https://example.com/cv.pdf");
    expect(resume).toHaveAttribute("target", "_blank");
  });

  it("renders only github and linkedin icons", () => {
    render(
      <Hero
        profile={profile}
        socials={[
          { platform: "GitHub", url: "https://github.com/aristache-labs" },
          { platform: "Facebook", url: "https://facebook.com/aristache" },
          { platform: "LinkedIn", url: "https://linkedin.com/in/aristache" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/aristache-labs",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/aristache",
    );
    expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
  });

  it("renders a scroll cue and no avatar image", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/scroll to explore/i)).toHaveAttribute("href", "#projects");
  });
});
