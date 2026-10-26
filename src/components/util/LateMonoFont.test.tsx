import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LateMonoFont } from "./LateMonoFont";

describe("LateMonoFont", () => {
  const added: unknown[] = [];
  const created: { family: string; source: string }[] = [];
  let readyState: DocumentReadyState = "loading";

  beforeEach(() => {
    added.length = 0;
    created.length = 0;
    readyState = "loading";
    vi.spyOn(document, "readyState", "get").mockImplementation(() => readyState);
    vi.stubGlobal(
      "FontFace",
      class {
        constructor(
          public family: string,
          public source: string,
        ) {
          created.push({ family, source });
        }
        load() {
          return Promise.resolve(this);
        }
      },
    );
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { add: (font: unknown) => added.push(font) },
    });
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => window.setTimeout(cb, 0));
    vi.stubGlobal("cancelIdleCallback", (id: number) => window.clearTimeout(id));
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("waits for the page load before fetching the font", async () => {
    render(<LateMonoFont />);
    await act(async () => vi.runAllTimers());
    expect(created).toHaveLength(0);

    readyState = "complete";
    await act(async () => {
      window.dispatchEvent(new Event("load"));
      vi.runAllTimers();
    });
    expect(created).toEqual([
      { family: "Geist Mono", source: "url(/fonts/GeistMono-Variable.woff2) format('woff2')" },
    ]);
    expect(added).toHaveLength(1);
  });

  it("loads straight away when the page has already loaded", async () => {
    readyState = "complete";
    render(<LateMonoFont />);
    await act(async () => vi.runAllTimers());
    expect(added).toHaveLength(1);
  });

  it("does nothing if unmounted before the page loads", async () => {
    const { unmount } = render(<LateMonoFont />);
    unmount();
    window.dispatchEvent(new Event("load"));
    await act(async () => vi.runAllTimers());
    expect(created).toHaveLength(0);
  });
});
