import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarPortrait } from "./AvatarPortrait";

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
    expect(screen.getByRole("button")).toBeDisabled();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent(image, new Event(event));
    expect(screen.getByAltText(`Portrait of ${NAME}`)).toHaveAttribute("src", SOURCE);
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("shows the portrait when the hero finished before hydration", () => {
    installHero(true);
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    expect(screen.getByAltText(`Portrait of ${NAME}`)).toHaveAttribute("src", SOURCE);
  });

  it("shows the portrait when the hero is absent", () => {
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    expect(screen.getByAltText(`Portrait of ${NAME}`)).toHaveAttribute("src", SOURCE);
  });

  it("keeps zoom unavailable until the hero finishes, then opens the original source", () => {
    const image = installHero(false);
    render(<AvatarPortrait src={SOURCE} name={NAME} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent.load(image);
    fireEvent.click(screen.getByRole("button"));
    expect(within(screen.getByRole("dialog")).getByAltText(`Portrait of ${NAME}`)).toHaveAttribute(
      "src",
      SOURCE,
    );
  });
});
