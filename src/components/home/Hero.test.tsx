import { act, render, screen, cleanup, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { FOLD_VIEWPORT_QUERY, HERO_VIDEO_QUERY } from "@/hooks/useMediaQuery";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { IDENTITY } from "@/lib/identity";
import { Hero } from "./Hero";
import { setConsentInset } from "@/lib/consent-inset";
import { CONSENT_KEY, saveAnalyticsConsent } from "@/lib/analytics-consent";

beforeEach(() => installMatchMedia());
afterEach(() => {
  cleanup();
  setConsentInset(0);
  vi.restoreAllMocks();
});

const profile = {
  name: "Adrian Cristache",
  roles: ["Full Stack Developer", "Flutter Developer"],
};

describe("Hero", () => {
  it("reserves the measured consent height and clears it when the panel closes", () => {
    const previousChoice = localStorage.getItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_KEY);
    const { container } = render(<Hero profile={profile} />);
    const hero = container.querySelector("#hero") as HTMLElement;
    expect(hero).not.toHaveAttribute("data-consent-visible");
    expect(hero).not.toHaveAttribute("data-consent-resolved");
    act(() => setConsentInset(125));
    expect(hero).toHaveAttribute("data-consent-visible", "true");
    expect(hero.style.getPropertyValue("--hero-consent-inset")).toBe("125px");
    act(() => setConsentInset(62));
    expect(hero.style.getPropertyValue("--hero-consent-inset")).toBe("62px");
    act(() => {
      saveAnalyticsConsent("rejected");
      setConsentInset(0);
    });
    expect(hero).not.toHaveAttribute("data-consent-visible");
    expect(hero).toHaveAttribute("data-consent-resolved", "true");
    expect(hero.style.getPropertyValue("--hero-consent-inset")).toBe("");
    if (previousChoice === null) localStorage.removeItem(CONSENT_KEY);
    else localStorage.setItem(CONSENT_KEY, previousChoice);
  });
  it("reserves the cinematic transition only when About is enabled", () => {
    const { container, rerender } = render(<Hero profile={profile} />);
    expect(container.querySelector("#hero")).not.toHaveAttribute("data-cinematic");
    rerender(<Hero profile={profile} transitionToAbout />);
    expect(container.querySelector("#hero")).toHaveAttribute("data-cinematic", "true");
  });

  it.each([
    [false, false, 0],
    [true, false, 0],
    [true, true, 0],
  ])(
    // The cursor-following spotlight was removed: moving the mouse must read no geometry.
    "never measures layout on mouse movement (desktop %s, reduced %s)",
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
      paragraphs.find((element) => element.textContent?.includes("Available for projects")),
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

  it("renders the full name, specialization and introduction immediately", () => {
    render(<Hero profile={profile} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAccessibleName("Adrian Cristache Infrastructure meets innovation.");
    expect(screen.getByText("Adrian", { selector: "span" })).toBeVisible();
    expect(h1.querySelector(".sr-only")).toBeNull();
    expect(h1.textContent).toBe("Adrian Cristache Infrastructure meets innovation.");
    expect(h1.querySelector("svg text")).toBeNull();
    expect(h1).toHaveTextContent("Adrian");
    expect(h1.lastElementChild).not.toBeEmptyDOMElement();
    expect(
      screen.getByText(
        /My experience spans enterprise IT, PowerShell automation and script security\./,
      ),
    ).toHaveTextContent("In my spare time, I build web and mobile applications.");
    expect(screen.getByText(profile.roles[0]).closest("p")).toHaveTextContent(
      profile.roles.join(" · "),
    );
  });

  it.each([
    ["Cristache Adrian", "Cristache", "Adrian"],
    ["  Adrian   Cristache  ", "Adrian", "Cristache"],
    ["Adrian", "Adrian", null],
  ])("preserves the profile name accessibly for %s", (name, first, remainder) => {
    render(<Hero profile={{ ...profile, name }} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(screen.getByText(first, { selector: "span" })).toBeVisible();
    if (remainder) {
      expect(h1.firstElementChild?.lastElementChild).toHaveTextContent(remainder);
      expect(h1).toHaveAccessibleName(
        first + " " + remainder + " Infrastructure meets innovation.",
      );
    } else {
      expect(h1.querySelector(".sr-only")).toBeNull();
      expect(h1.textContent).toBe(`${first} Infrastructure meets innovation.`);
      expect(h1.querySelector("svg text")).toBeNull();
    }
  });

  it("renders the hero tagline chip", () => {
    render(<Hero profile={profile} heroTagline="Building AI-native products" />);
    expect(screen.getByText(/building ai-native products/i)).toBeInTheDocument();
  });

  it("omits the chip without a hero tagline", () => {
    render(<Hero profile={profile} />);
    expect(screen.queryByText(/building ai-native products/i)).not.toBeInTheDocument();
  });

  it("shows the managed roles without changing the profile", () => {
    render(<Hero profile={profile} />);
    expect(screen.getByText(profile.roles[0]).closest("p")).toHaveTextContent(
      profile.roles.join(" · "),
    );
    expect(screen.queryByText("// scope")).not.toBeInTheDocument();
    expect(profile.roles).toEqual(["Full Stack Developer", "Flutter Developer"]);
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

  it.each([false, true])(
    "enables Fold portrait video after its poster loads unless reduced motion is set (%s)",
    (reduced) => {
      installMatchMedia({ [FOLD_VIEWPORT_QUERY]: true, [REDUCED_MOTION_QUERY]: reduced });
      vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
      vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
      const { container } = render(<Hero profile={profile} />);
      expect(container.querySelector("video")).toBeNull();
      const image = container.querySelector("picture img")!;
      Object.defineProperty(image, "currentSrc", {
        configurable: true,
        value: "http://localhost/media/hero-1280.webp",
      });
      fireEvent.load(image);
      if (reduced) {
        expect(container.querySelector("video")).toBeNull();
        expect(screen.queryByRole("button", { name: /background video/i })).not.toBeInTheDocument();
      } else {
        expect(container.querySelector("video source")).toHaveAttribute(
          "src",
          "/media/hero-v2.mp4",
        );
        expect(screen.getByRole("button", { name: "Pause background video" })).toBeInTheDocument();
      }
    },
  );

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
    expect(container.querySelector("video source")).toHaveAttribute("src", "/media/hero-v2.mp4");
    expect(container.querySelector("picture img")).toBe(image);
  });
  it("resumes the video only after scrolling back to the hero has settled", () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    let paused = false;
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
      paused = true;
    });
    let notify: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    installMatchMedia({ [HERO_VIDEO_QUERY]: true });
    const { container } = render(<Hero profile={profile} />);
    fireEvent.load(container.querySelector("picture img")!);
    expect(container.querySelector("video")).not.toBeNull();

    act(() => notify([{ isIntersecting: false }]));
    expect(paused).toBe(true);
    act(() => notify([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(300));
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(300));
    expect(play).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(200));
    expect(play).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const stubObserver = () => {
    let notify: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    return (entries: Partial<IntersectionObserverEntry>[]) => notify(entries);
  };
  const stubPlayback = () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    return vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  };

  it("releases the decoder after a long absence on touch devices and plays a fresh video on return", () => {
    vi.useFakeTimers();
    const notify = stubObserver();
    const load = stubPlayback();
    installMatchMedia({ [HERO_VIDEO_QUERY]: true, "(pointer: coarse)": true });
    const { container } = render(<Hero profile={profile} />);
    fireEvent.load(container.querySelector("picture img")!);
    const first = container.querySelector("video")!;

    act(() => notify([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(1600));
    expect(first.querySelector("source")).toBeNull();
    expect(load).toHaveBeenCalled();

    act(() => notify([{ isIntersecting: true }]));
    const second = container.querySelector("video")!;
    expect(second).not.toBe(first);
    expect(second.querySelector("source")).not.toBeNull();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the very same video through a short scroll away and back", () => {
    vi.useFakeTimers();
    const notify = stubObserver();
    stubPlayback();
    installMatchMedia({ [HERO_VIDEO_QUERY]: true, "(pointer: coarse)": true });
    const { container } = render(<Hero profile={profile} />);
    fireEvent.load(container.querySelector("picture img")!);
    const video = container.querySelector("video")!;
    act(() => notify([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(300));
    act(() => notify([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("video")).toBe(video);
    expect(video.querySelector("source")).not.toBeNull();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("never releases the video on desktop pointers while the hero is away", () => {
    vi.useFakeTimers();
    const notify = stubObserver();
    stubPlayback();
    installMatchMedia({ [HERO_VIDEO_QUERY]: true });
    const { container } = render(<Hero profile={profile} />);
    fireEvent.load(container.querySelector("picture img")!);
    const video = container.querySelector("video")!;
    act(() => notify([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(5000));
    expect(video.querySelector("source")).not.toBeNull();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lets go of the decoder when the page is hidden and rebuilds the video when it is restored", () => {
    stubObserver();
    const load = stubPlayback();
    installMatchMedia({ [HERO_VIDEO_QUERY]: true });
    const { container } = render(<Hero profile={profile} />);
    fireEvent.load(container.querySelector("picture img")!);
    const first = container.querySelector("video")!;

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(first.querySelector("source")).toBeNull();
    expect(first.hasAttribute("src")).toBe(false);
    expect(load).toHaveBeenCalled();

    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    act(() => {
      window.dispatchEvent(restored);
    });
    const second = container.querySelector("video")!;
    expect(second).not.toBe(first);
    expect(second.querySelector("source")).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
