import { render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { IDENTITY } from "@/lib/identity";
import { Hero } from "./Hero";

beforeEach(() => installMatchMedia());
afterEach(cleanup);

const profile = {
  name: "Adrian Cristache",
  roles: ["Full Stack Developer", "Flutter Developer"],
};

describe("Hero", () => {
  it("does not hide the initial hero copy or actions behind JavaScript", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <Hero
        profile={profile}
        heroTagline="Available for projects"
        resumeUrl="/resume.pdf"
        socials={[{ platform: "GitHub", url: "https://github.com/aristache-labs" }]}
      />,
    );

    const paragraphs = [...container.querySelectorAll("p")];
    const elements = [
      container.querySelector("h1"),
      container.querySelector('a[href="#projects"]'),
      container.querySelector('a[href="#contact"]'),
      container.querySelector('a[href="/resume.pdf"]'),
      container.querySelector('a[aria-label="GitHub"]'),
      ...container.querySelectorAll("h1 span"),
      paragraphs.find((element) => element.textContent === IDENTITY.summary),
      paragraphs.find((element) => element.textContent === "// HELLO, I'M"),
      paragraphs.find((element) => element.textContent?.includes("Available for projects")),
      paragraphs.find((element) => element.textContent?.includes(profile.roles[0])),
    ];

    for (const element of elements) {
      expect(element).toBeDefined();
      expect(element).not.toBeNull();
      let current = element as HTMLElement | null;
      while (current) {
        expect(current.hidden).toBe(false);
        expect(current.style.opacity).not.toBe("0");
        expect(current.style.visibility).not.toBe("hidden");
        expect(current.style.transform).not.toContain("translateY(12px)");
        current = current.parentElement;
      }
    }
  });

  it("renders only the first name, complete greeting and deployment proof immediately", () => {
    render(<Hero profile={profile} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).not.toHaveTextContent("Cristache");
    expect(h1.textContent).toMatch(/Adrian\s+IT expertise\. Web & mobile development\./);
    expect(
      screen.getByText(
        /My experience spans enterprise IT, PowerShell automation and script security\./,
      ),
    ).toHaveTextContent("In my spare time, I build web and mobile applications.");
    expect(screen.getByText("// HELLO, I'M")).toBeInTheDocument();
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

  it("renders a single hero poster and no video controls on a touch viewport", () => {
    const { container } = render(<Hero profile={profile} />);
    expect(container.querySelectorAll('img[src="/media/hero.webp"]')).toHaveLength(1);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("button", { name: /background video/i })).not.toBeInTheDocument();
  });
});
