import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { installMatchMedia } from "@/test/matchMedia";
import { PROJECTS_PORTRAIT_QUERY, ProjectsArrival } from "./ProjectsArrival";
import { beginSectionNavigation } from "@/lib/section-navigation";

const observers = new Map<Element, IntersectionObserverCallback>();

beforeEach(() => {
  observers.clear();
  installMatchMedia({ [PROJECTS_PORTRAIT_QUERY]: true });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        observers.set(target, this.callback);
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Projects mobile arrivals", () => {
  it("keeps unplayed cards prepared throughout menu travel and arrival", () => {
    const { container } = render(
      <section id="projects">
        <ProjectsArrival>Project</ProjectsArrival>
      </section>,
    );
    const section = container.firstElementChild as HTMLElement;
    const card = section.firstElementChild!;
    let arrive!: () => void;
    act(() => {
      arrive = beginSectionNavigation(section);
    });
    expect(card).toHaveAttribute("data-project-reveal", "armed");
    act(() => {
      observers.get(card)!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(card).toHaveAttribute("data-project-reveal", "armed");
    act(() => arrive());
    expect(card).toHaveAttribute("data-project-reveal", "armed");
    act(() => {
      observers.get(card)!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(card).toHaveAttribute("data-project-reveal", "play");
    act(() => {
      arrive = beginSectionNavigation(section);
    });
    expect(card).toHaveAttribute("data-project-reveal", "play");
    act(() => arrive());
    expect(card).toHaveAttribute("data-project-reveal", "play");
  });

  it("reveals each card independently in Strict Mode", () => {
    const { container } = render(
      <StrictMode>
        <ProjectsArrival>First project</ProjectsArrival>
        <ProjectsArrival>Second project</ProjectsArrival>
      </StrictMode>,
    );
    const cards = container.querySelectorAll("[data-project-kind]");
    expect(cards[0]).toHaveAttribute("data-project-reveal", "armed");
    expect(cards[1]).toHaveAttribute("data-project-reveal", "armed");
    act(() => {
      observers.get(cards[0])!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(cards[0]).toHaveAttribute("data-project-reveal", "play");
    expect(cards[1]).toHaveAttribute("data-project-reveal", "armed");
  });

  it("reveals a focused action immediately", () => {
    render(
      <ProjectsArrival kind="action">
        <button>View project</button>
      </ProjectsArrival>,
    );
    const button = screen.getByRole("button");
    fireEvent.focusIn(button);
    expect(button.parentElement).toHaveAttribute("data-project-reveal", "static");
  });

  it("leaves content visible with reduced motion", () => {
    installMatchMedia({ [PROJECTS_PORTRAIT_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    const { container } = render(<ProjectsArrival>Project</ProjectsArrival>);
    expect(container.firstElementChild).not.toHaveAttribute("data-project-reveal");
    expect(observers.size).toBe(0);
  });
});
