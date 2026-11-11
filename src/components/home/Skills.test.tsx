import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import { Skills } from "./Skills";
import { MotionProvider } from "@/components/motion/MotionProvider";

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, className }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

const mockSkills = [
  { name: "React", iconPath: "/skills/react.svg", category: "Frontend", order: 1, level: "Expert" },
  { name: "TypeScript", iconPath: "/skills/typescript.svg", category: "Frontend", order: 2 },
  { name: "Node.js", iconPath: "/skills/nodejs.svg", category: "Backend", order: 3 },
  { name: "PostgreSQL", iconPath: "/skills/postgresql.svg", category: "Backend", order: 4 },
];

describe("Skills", () => {
  beforeEach(() => installMatchMedia());

  describe("deferred icons", () => {
    const originalObserver = globalThis.IntersectionObserver;
    let notify: IntersectionObserverCallback;
    const disconnect = vi.fn();

    beforeEach(() => {
      disconnect.mockClear();
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(private callback: IntersectionObserverCallback) {}
          observe(target: Element) {
            if (target.id === "skills") notify = this.callback;
          }
          unobserve() {}
          disconnect = disconnect;
        },
      );
    });

    afterEach(() => {
      cleanup();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    });

    const activeIcons = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('img[src^="/skills/"]')).filter(
        // The decorative marquee repeats the logos; these tests are about the cards.
        (image) => !image.closest("noscript") && !image.closest("[aria-hidden]"),
      );

    it("shows each logo in the decorative marquee once icons are near, hidden from assistive tech", () => {
      const { container } = render(<Skills skills={mockSkills} />);
      const strip = () => container.querySelector('[aria-hidden="true"] img[src^="/skills/"]');
      expect(strip()).toBeNull();
      act(() =>
        notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver),
      );
      const logos = container.querySelectorAll('[aria-hidden="true"] img[src^="/skills/"]');
      expect(logos).toHaveLength(mockSkills.length * 2);
      logos.forEach((logo) => expect(logo).toHaveAttribute("alt", ""));
    });

    it("waits for Skills to approach before exposing icon URLs", async () => {
      const { container } = render(<Skills skills={mockSkills} />);
      const emit = (isIntersecting: boolean) =>
        act(() =>
          notify([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
        );

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(activeIcons(container)).toHaveLength(0);
      emit(false);
      expect(activeIcons(container)).toHaveLength(0);
      emit(true);
      expect(activeIcons(container)).toHaveLength(4);
      expect(disconnect).toHaveBeenCalled();
      for (const image of activeIcons(container)) {
        expect(image).toHaveAttribute("width", "36");
        expect(image).toHaveAttribute("height", "36");
        expect(image.parentElement).toHaveClass("size-9");
      }
      fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
      // Cards leaving the filter finish a short exit before they unmount.
      await waitFor(() => expect(activeIcons(container)).toHaveLength(2));
      emit(false);
      expect(activeIcons(container)).toHaveLength(2);
    });

    it("loads icons when IntersectionObserver is unavailable", async () => {
      vi.stubGlobal("IntersectionObserver", undefined);
      const { container } = render(<Skills skills={mockSkills} />);
      await waitFor(() => expect(activeIcons(container)).toHaveLength(4));
    });

    it("keeps SSR content and reserves icon boxes with a no-JavaScript image fallback", () => {
      const html = renderToString(<Skills skills={mockSkills} />);
      const fallbacks = html.match(/<noscript>[\s\S]*?<\/noscript>/g) ?? [];
      expect(fallbacks).toHaveLength(4);
      expect(fallbacks[0]).toContain('src="/skills/react.svg"');
      expect(fallbacks[0]).toContain('width="36" height="36"');
      const scriptedHtml = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
      expect(scriptedHtml).not.toMatch(/src="\/skills\//);
      expect(scriptedHtml).toContain("React");
      expect(scriptedHtml).toContain("size-9");
    });
  });

  it("keeps the section label and title in one entrance, separate from the quote", () => {
    const { container } = render(<Skills skills={mockSkills} />);
    const title = screen.getByRole("heading", { name: "Tools I trust" });
    const entrance = title.parentElement!;
    expect(entrance.querySelector("[data-scroll-anchor]")).toHaveTextContent("02Skills");
    expect(entrance.querySelector("blockquote")).toBeNull();
    expect(container.querySelector("aside blockquote")).toHaveTextContent(
      "Tools evolve.Problem-solving endures.",
    );
  });

  it("drives the cards from scrolling on expressive desktops, without pinning", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [PINNED_SCENE_QUERY]: true });
    const { container } = render(<Skills skills={mockSkills} />);
    const section = container.querySelector("#skills")!;
    expect(section).toHaveAttribute("data-scene");
    expect(section.querySelector("[data-scroll-landing]")).toBeNull();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("keeps the timed entrance outside the desktop scene", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<Skills skills={mockSkills} />);
    expect(container.querySelector("#skills")).not.toHaveAttribute("data-scene");
  });

  it("renders skill names", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("serves visible skill text and final level bars without waiting for animation", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Skills skills={mockSkills} />);
    const name = container.querySelector('[title="React"]');
    expect(name).not.toBeNull();
    for (let node = name; node; node = node.parentElement) {
      expect((node as HTMLElement).style.opacity).not.toBe("0");
    }
    expect(
      [...container.querySelectorAll("span")].some(
        (node) => node.style.transform === "scaleX(0.9)",
      ),
    ).toBe(true);
  });

  it("keeps the entrance group mounted during rapid category changes", async () => {
    render(<Skills skills={mockSkills} />);
    const group = screen.getByText("React").closest(".grid");
    expect(group).not.toBeNull();
    for (const category of ["Backend", "Frontend", "Backend"]) {
      fireEvent.click(screen.getByRole("tab", { name: category }));
    }
    await waitFor(() => expect(screen.queryByText("React")).not.toBeInTheDocument());
    expect(screen.getByText("Node.js").closest(".grid")).toBe(group);
    expect(group).not.toHaveStyle({ opacity: "0" });
  });

  it("moves a single active pill to the selected tab", () => {
    const { container } = render(<Skills skills={mockSkills} />);
    const pills = () => container.querySelectorAll('[role="tab"] > span[aria-hidden]');
    expect(pills()).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Most Used" })).toContainElement(
      pills()[0] as HTMLElement,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
    expect(pills()).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Backend" })).toContainElement(
      pills()[0] as HTMLElement,
    );
  });

  it("renders category filters from the skill list", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByRole("tab", { name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Backend" })).toBeInTheDocument();
  });

  it("serves category buttons visibly before hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Skills skills={mockSkills} />);
    for (const button of container.querySelectorAll('[role="tab"]')) {
      expect((button as HTMLElement).style.opacity).not.toBe("0");
      expect((button as HTMLElement).style.transform).not.toContain("scale(0)");
    }
  });

  it.each([true, false])(
    "reveals pending buttons immediately for keyboard focus (desktop=%s)",
    async (desktop) => {
      installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
      const originalObserver = globalThis.IntersectionObserver;
      const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 2000,
        left: 0,
      } as DOMRect);
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
      try {
        await act(async () => {
          render(
            <MotionProvider>
              <Skills skills={mockSkills} />
            </MotionProvider>,
          );
        });
        const buttons = screen.getAllByRole("tab");
        expect(buttons[0]).toHaveStyle({ opacity: "0", transform: "scale(0)" });
        act(() => buttons[0].focus());
        await waitFor(() => {
          for (const button of buttons) expect(button).toHaveStyle({ opacity: "1" });
        });
        fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
        for (const button of buttons) expect(button).toHaveStyle({ opacity: "1" });
      } finally {
        cleanup();
        bounds.mockRestore();
        vi.stubGlobal("IntersectionObserver", originalObserver);
      }
    },
  );

  it.each([
    ["desktop", true, false],
    ["mobile portrait", false, false],
    ["mobile landscape", false, false],
    ["reduced motion", true, true],
  ])(
    "retains shared cards while changing their order on %s",
    async (_profile, desktop, reduced) => {
      installMatchMedia({
        [EXPRESSIVE_MOTION_QUERY]: desktop,
        [REDUCED_MOTION_QUERY]: reduced,
      });
      const skills = [
        { ...mockSkills[0], category: "Development", level: "55", order: 0 },
        { ...mockSkills[1], category: "Development", level: "90", order: 1 },
        { ...mockSkills[2], category: "Infrastructure", level: "75", order: 2 },
      ];
      const { container } = render(<Skills skills={skills} />);
      const reactCard = screen.getByTitle("React");
      const typescriptCard = screen.getByTitle("TypeScript");
      const names = () =>
        [...container.querySelectorAll("[title]")].map((node) => node.getAttribute("title"));
      expect(names()).toEqual(["TypeScript", "Node.js", "React"]);
      fireEvent.click(screen.getByRole("tab", { name: "Development" }));
      await waitFor(() => expect(names()).toEqual(["React", "TypeScript"]));
      expect(screen.getByTitle("React")).toBe(reactCard);
      expect(screen.getByTitle("TypeScript")).toBe(typescriptCard);
      const mostUsed = screen.getByRole("tab", { name: "Most Used" });
      act(() => mostUsed.focus());
      fireEvent.click(mostUsed);
      await waitFor(() => expect(names()).toEqual(["TypeScript", "Node.js", "React"]));
      expect(screen.getByTitle("React")).toBe(reactCard);
      expect(screen.getByTitle("TypeScript")).toBe(typescriptCard);
      expect(screen.getByRole("tab", { name: "Most Used" })).toHaveFocus();
    },
  );

  it.each([false, true])(
    "shows newly added cards after filtering (reduced=%s)",
    async (reduced) => {
      installMatchMedia({ [REDUCED_MOTION_QUERY]: reduced });
      render(<Skills skills={mockSkills} />);
      fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
      fireEvent.click(screen.getByRole("tab", { name: "Frontend" }));
      const entrance = screen.getByTitle("React").closest(".h-full")!.parentElement!;
      if (reduced) expect(entrance).toHaveStyle({ opacity: "1" });
      await waitFor(() => expect(entrance).toHaveStyle({ opacity: "1" }));
      await waitFor(() => expect(screen.queryByTitle("Node.js")).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole("tab", { name: "Frontend" }));
      expect(screen.getByTitle("React").closest(".h-full")!.parentElement).toBe(entrance);
    },
  );

  it("renders section heading", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("Tools I")).toBeInTheDocument();
    expect(screen.getByText("trust")).toBeInTheDocument();
    expect(screen.getByText(/Infrastructure on one side/)).toBeInTheDocument();
    expect(screen.getByText(/Tools evolve\./).closest("blockquote")).toHaveTextContent(
      "Problem-solving endures.",
    );
  });

  it("shows the level as a percent", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("filters to the selected category", async () => {
    render(<Skills skills={mockSkills} />);
    fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
    await waitFor(() => expect(screen.queryByText("React")).not.toBeInTheDocument());
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("shows eight skills on Most Used and the rest inside a category", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      name: `Skill ${i}`,
      iconPath: "/skills/x.svg",
      category: i === 8 ? "Extra" : "Frontend",
      order: i,
    }));
    render(<Skills skills={many} />);
    expect(screen.getAllByText(/^Skill \d$/)).toHaveLength(8);
    expect(screen.queryByText("Skill 8")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Extra" }));
    expect(screen.getByText("Skill 8")).toBeInTheDocument();
  });

  it.each([false, true])("limits Most Used by desktop layout (desktop=%s)", (desktop) => {
    installMatchMedia({ "(min-width: 1024px) and (pointer: fine)": desktop });
    const many = Array.from({ length: 14 }, (_, i) => ({
      name: `Technology ${i}`,
      iconPath: "/skills/x.svg",
      category: "Development",
      order: i,
      level: String(100 - i),
    }));
    const { container } = render(<Skills skills={many} />);
    const names = [...container.querySelectorAll("[title]")].map((n) => n.getAttribute("title"));
    expect(names).toEqual(many.slice(0, desktop ? 12 : 8).map((skill) => skill.name));
  });

  it("ranks Most Used by level then admin order and keeps stored names", async () => {
    const ranked = [
      { name: "Missing", order: 0, level: null },
      { name: "Zero", order: 1, level: "0" },
      { name: "Invalid", order: 0, level: "invalid" },
      { name: "Numeric", order: 4, level: "90" },
      { name: "Legacy", order: 2, level: "Expert" },
      { name: "Highest", order: 20, level: "100" },
      { name: "Middle", order: 3, level: "Intermediate" },
      { name: "Beginner", order: 5, level: "Beginner" },
      { name: "Other", order: 6, level: "80" },
      { name: "Last rated", order: 7, level: "10" },
    ].map((skill) => ({ ...skill, category: "Development", iconPath: "/skills/x.svg" }));
    const { container } = render(<Skills skills={ranked} />);
    const names = () =>
      Array.from(container.querySelectorAll("[title]")).map((node) => node.getAttribute("title"));
    const expected = [
      "Highest",
      "Legacy",
      "Numeric",
      "Other",
      "Middle",
      "Beginner",
      "Last rated",
      "Zero",
    ];
    expect(screen.getByRole("tab", { name: "Most Used" })).toHaveAttribute("aria-selected", "true");
    expect(names()).toEqual(expected);
    fireEvent.click(screen.getByRole("tab", { name: "Development" }));
    expect(names()).toHaveLength(10);
    expect(names()[0]).toBe("Missing");
    fireEvent.click(screen.getByRole("tab", { name: "Most Used" }));
    await waitFor(() => expect(names()).toEqual(expected));
    expect(ranked[0].name).toBe("Missing");
  });

  it("renders the skills section with correct id", () => {
    const { container } = render(<Skills skills={mockSkills} />);
    expect(container.querySelector("#skills")).toBeTruthy();
  });

  it("renders an empty state gracefully", () => {
    render(<Skills skills={[]} />);
    expect(screen.getByText("Tools I")).toBeInTheDocument();
  });
});

describe("Skills category tabs", () => {
  beforeEach(() => installMatchMedia({ [REDUCED_MOTION_QUERY]: true }));
  afterEach(cleanup);

  it("links tabs to one panel and moves selection with the keyboard", () => {
    render(
      <MotionProvider>
        <Skills skills={mockSkills} />
      </MotionProvider>,
    );
    const tabs = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    tabs.forEach((tab) => expect(tab).toHaveAttribute("aria-controls", panel.id));
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);

    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tabs[1].id);

    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[2]).toHaveFocus();
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });
});
