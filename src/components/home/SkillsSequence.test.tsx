import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkillCard } from "./SkillCard";
import { SkillSlot, SkillsScene } from "./SkillsSequence";
import { beginSectionNavigation } from "@/lib/section-navigation";

vi.mock("next/image", () => ({
  default: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const scroll = vi.hoisted(() => ({
  y: null as import("framer-motion").MotionValue<number> | null,
  animate: vi.fn(),
}));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    animate: scroll.animate,
    useScroll: () => {
      scroll.y = actual.useMotionValue(0);
      return { scrollY: scroll.y };
    },
  };
});

let sectionTop = 0;
/** Section top that puts the scene at `progress`: from 90% of the viewport up to its top. */
const topFor = (progress: number) => (1 - progress) * 0.9 * innerHeight;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Scene({ enabled = true }: { enabled?: boolean }) {
  const section = useRef<HTMLElement>(null);
  return (
    <section ref={section} data-testid="section">
      <SkillsScene section={section} enabled={enabled}>
        <SkillSlot index={0}>
          <span>First</span>
        </SkillSlot>
        <SkillSlot index={3}>
          <SkillCard name="React" iconPath="/skills/react.svg" level="80" />
        </SkillSlot>
      </SkillsScene>
    </section>
  );
}

const scrollTo = (progress: number) => {
  sectionTop = topFor(progress);
  act(() => scroll.y!.set(progress * 1000 + 1));
};

describe("SkillsScene", () => {
  it("finishes its timed menu entrance despite trailing scroll updates and never replays", () => {
    const stop = vi.fn();
    scroll.animate.mockClear();
    scroll.animate.mockReturnValue({ stop });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top: sectionTop }) as DOMRect,
    );
    sectionTop = topFor(0);
    const { getByTestId, getByText } = render(<Scene />);
    const section = getByTestId("section");
    const slot = getByText("First").parentElement!;
    let arrive!: () => void;
    act(() => {
      arrive = beginSectionNavigation(section);
    });
    scrollTo(1);
    expect(slot.style.getPropertyValue("--card-entry")).toBe("0");
    act(() => arrive());
    expect(scroll.animate).toHaveBeenCalledTimes(1);
    const options = scroll.animate.mock.calls[0][2];
    act(() => options.onUpdate(0.5));
    const partial = Number(slot.style.getPropertyValue("--card-entry"));
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
    scrollTo(0.99);
    scrollTo(1);
    expect(stop).not.toHaveBeenCalled();
    expect(Number(slot.style.getPropertyValue("--card-entry"))).toBe(partial);
    act(() => {
      options.onUpdate(1);
      options.onComplete();
    });
    expect(slot.style.getPropertyValue("--card-entry")).toBe("1");
    act(() => {
      arrive = beginSectionNavigation(section);
    });
    act(() => arrive());
    expect(scroll.animate).toHaveBeenCalledTimes(1);
    expect(slot.style.getPropertyValue("--card-entry")).toBe("1");
  });

  it("assembles cards in turn and keeps them when scrolling back up", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top: sectionTop }) as DOMRect,
    );
    sectionTop = topFor(0);
    const { getByTestId, getByText, container } = render(<Scene />);
    const section = getByTestId("section");
    const first = getByText("First").parentElement!;
    const card = container.querySelector<HTMLElement>("[title='React']")!.closest("div")!;
    const slot = card.parentElement!;
    const label = container.querySelector(".font-mono")!;
    expect(section.style.getPropertyValue("--skills-light")).toBe("0");
    expect(label).toHaveTextContent("0%");

    scrollTo(0.675);
    expect(first.style.getPropertyValue("--card-entry")).toBe("1");
    expect(Number(slot.style.getPropertyValue("--card-entry"))).toBeCloseTo(0.5);
    expect(label).toHaveTextContent("40%");

    scrollTo(1);
    expect(label).toHaveTextContent("80%");
    expect(section.style.getPropertyValue("--skills-light")).toBe("1");

    scrollTo(0);
    expect(slot.style.getPropertyValue("--card-entry")).toBe("1");
    expect(label).toHaveTextContent("80%");
    expect(section.style.getPropertyValue("--skills-light")).toBe("1");
  });

  it("leaves the cards alone outside the desktop scene", () => {
    const { getByTestId, getByText } = render(<Scene enabled={false} />);
    expect(getByTestId("section").style.getPropertyValue("--skills-light")).toBe("");
    expect(getByText("First").parentElement!.style.getPropertyValue("--card-entry")).toBe("");
  });
});
