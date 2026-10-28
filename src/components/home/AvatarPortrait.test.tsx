import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarPortrait } from "./AvatarPortrait";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    quality,
    sizes,
    loading,
    className,
  }: ComponentProps<"img"> & { quality?: number }) =>
    createElement("img", {
      src,
      alt,
      "data-quality": quality,
      sizes,
      loading,
      className,
    }),
}));

const SOURCE = "/images/aristache.webp";
const NAME = "Cristache Adrian";

describe("AvatarPortrait", () => {
  let hero: HTMLElement | undefined;

  function installHero(complete: boolean) {
    hero = document.createElement("section");
    hero.id = "hero";
    const image = document.createElement("img");
    image.src = "/media/hero.webp";
    image.setAttribute("fetchpriority", "high");
    Object.defineProperty(image, "complete", { configurable: true, value: complete });
    hero.append(image);
    document.body.append(hero);
    return image;
  }

  afterEach(() => {
    cleanup();
    hero?.remove();
    hero = undefined;
  });

  it("omits the portrait URL from server HTML", () => {
    expect(renderToString(<AvatarPortrait src={SOURCE} name={NAME} />)).not.toContain(SOURCE);
  });

  it.each(["load", "error"])("releases the portrait after the hero %s event", (event) => {
    const image = installHero(false);
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    expect(screen.queryByAltText(`Portrait of ${NAME}`)).not.toBeInTheDocument();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent(image, new Event(event));
    expect(screen.getByAltText(`Portrait of ${NAME}`)).toHaveAttribute("src", SOURCE);
  });

  it("shows the portrait when the hero finished before hydration", () => {
    installHero(true);
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    expect(screen.getByAltText(`Portrait of ${NAME}`)).toHaveAttribute("src", SOURCE);
  });

  it("shows the portrait at quality 75 with responsive sizes when the hero is absent", () => {
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    const image = screen.getByAltText(`Portrait of ${NAME}`);
    expect(image).toHaveAttribute("src", SOURCE);
    expect(image).toHaveAttribute("data-quality", "75");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image.getAttribute("sizes")).toContain(
      "(orientation: portrait) and (max-width: 767px) 192px",
    );
    expect(image.getAttribute("sizes")).toContain("(min-width: 1024px) 384px");
  });

  it("adds the decorative border beside the photo without animating its frame", () => {
    const { container } = render(<AvatarPortrait src={SOURCE} name={NAME} />);
    const image = screen.getByAltText(`Portrait of ${NAME}`);
    const border = container.querySelector('div[style*="--shine-width"]');
    expect(border).toHaveAttribute("aria-hidden", "true");
    expect(border?.parentElement).toBe(image.parentElement?.parentElement);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(image.parentElement?.parentElement).not.toHaveAttribute("style");
    expect(image).toHaveClass("object-cover");
  });

  it("is not interactive", () => {
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(screen.getByAltText(`Portrait of ${NAME}`));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
