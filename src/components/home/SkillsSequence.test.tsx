import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkillCard } from "./SkillCard";
import { SkillSlot, SkillsScene } from "./SkillsSequence";

vi.mock("next/image", () => ({
  default: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const scroll = vi.hoisted(() => ({
  y: null as import("framer-motion").MotionValue<number> | null,
}));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
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
