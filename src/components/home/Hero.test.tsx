import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { HERO_VIDEO_QUERY } from "@/hooks/useMediaQuery";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { IDENTITY } from "@/lib/identity";
import { Hero } from "./Hero";

beforeEach(() => installMatchMedia());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const profile = {
  name: "Adrian Cristache",
  roles: ["Full Stack Developer", "Flutter Developer"],
};

describe("Hero", () => {
  it.each([
    [false, false, 0],
    [true, false, 1],
    [true, true, 0],
  ])(
    "runs pointer geometry only for desktop motion (%s, reduced %s)",
    (desktop, reduced, calls) => {
      installMatchMedia({
        [EXPRESSIVE_MOTION_QUERY]: desktop,
        [REDUCED_MOTION_QUERY]: reduced,
      });
      const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
      const { container } = render(<Hero profile={profile} />);
      bounds.mockClear();
      const move = new Event("pointermove", { bubbles: true });
      Object.defineProperties(move, {
        pointerType: { value: "mouse" },
        clientX: { value: 100 },
        clientY: { value: 100 },
      });
      fireEvent(container.querySelector("section")!, move);
      expect(bounds).toHaveBeenCalledTimes(calls);
    },
  );

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
      ...paragraphs.filter((element) => element.textContent === "// scope"),
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
    expect(h1).toHaveTextContent("Adrian");
    expect(h1.lastElementChild).not.toBeEmptyDOMElement();
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

  it("exposes responsive poster sources in server HTML without lazy loading or duplicate images", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Hero profile={profile} />);
    const picture = container.querySelector("picture");
    const image = picture?.querySelector("img");
    const source = picture?.querySelector("source");
    expect(picture?.querySelectorAll("img")).toHaveLength(1);
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).not.toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("sizes", "max(100vw, 178lvh)");
    expect(image?.getAttribute("srcset")).toContain("/media/hero-960.webp 960w");
    expect(image?.getAttribute("srcset")).toContain("/media/hero.webp 1672w");
    expect(source).toHaveAttribute("srcset", "/media/hero-portrait.webp");
    expect(source?.getAttribute("media")).toContain("max-aspect-ratio: 3/4");
    expect(container.querySelector("video")).toBeNull();
  });

  it("waits for the full-frame poster after rotating from portrait to landscape", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const portraitQuery =
      "(max-width: 767px) and (orientation: portrait) and (max-aspect-ratio: 3/4)";
    const matches = { [portraitQuery]: true, [HERO_VIDEO_QUERY]: false };
    installMatchMedia(matches);
    const { container, rerender } = render(<Hero profile={profile} />);
    const image = container.querySelector("picture img")!;
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/media/hero-portrait.webp",
    });
    fireEvent.load(image);
    expect(container.querySelector("video")).toBeNull();

    matches[portraitQuery] = false;
    matches[HERO_VIDEO_QUERY] = true;
    rerender(<Hero profile={profile} />);
    expect(container.querySelector("video")).toBeNull();

    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/media/hero-1280.webp",
    });
    fireEvent.load(image);
    expect(container.querySelector("video source")).toHaveAttribute("src", "/media/hero.mp4");
    expect(container.querySelector("picture img")).toBe(image);
  });
});
