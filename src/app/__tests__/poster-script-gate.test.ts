import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = readFileSync(join(process.cwd(), "scripts/poster-script-gate.js"), "utf8");

/** Run the gate the way the browser does: as soon as its own <script> has been parsed. */
function runGate(portrait: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: portrait }));
  new Function(source)();
}

const DEFERRED = `
  <link rel="preload" as="script" data-poster-src="/_next/static/chunks/webpack.js">
  <script data-poster-src="/_next/static/chunks/main-app.js" async></script>
`;

beforeEach(() => {
  document.head.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("poster script gate", () => {
  it("gives a source to scripts that Next already placed before the gate", () => {
    // These come first in <head>, so the gate never sees them being added.
    document.head.innerHTML = DEFERRED;
    runGate(false);
    expect(document.querySelector("script")).toHaveAttribute(
      "src",
      "/_next/static/chunks/main-app.js",
    );
    expect(document.querySelector("link")).toHaveAttribute(
      "href",
      "/_next/static/chunks/webpack.js",
    );
    expect(document.querySelector("[data-poster-src]")).toBeNull();
  });

  it("still handles scripts that are added after it", async () => {
    runGate(false);
    document.head.insertAdjacentHTML("beforeend", DEFERRED);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector("script")).toHaveAttribute("src");
    expect(document.querySelector("[data-poster-src]")).toBeNull();
  });

  it("holds portrait phones' scripts back until the hero portrait has loaded or time runs out", () => {
    vi.useFakeTimers();
    document.head.innerHTML = DEFERRED;
    runGate(true);
    expect(document.querySelector("script")).not.toHaveAttribute("src");
    vi.advanceTimersByTime(4000);
    expect(document.querySelector("script")).toHaveAttribute(
      "src",
      "/_next/static/chunks/main-app.js",
    );
  });
});
