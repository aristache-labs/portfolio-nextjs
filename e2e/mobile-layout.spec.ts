import { expect, test, type Page } from "./fixtures";

async function measure(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const safeArea = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    probe.remove();
    return {
      viewport: [...document.querySelectorAll<HTMLMetaElement>('meta[name="viewport"]')].map(
        (element) => element.content,
      ),
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      visual: window.visualViewport && {
        width: window.visualViewport.width,
        height: window.visualViewport.height,
        scale: window.visualViewport.scale,
        offsetLeft: window.visualViewport.offsetLeft,
      },
      rootFont: getComputedStyle(document.documentElement).fontSize,
      safeArea,
      boxes: ["html", "body", "[data-site]", "#hero", "#hero > div:first-child"].map((selector) => {
        const element = document.querySelector(selector)!;
        const rect = element.getBoundingClientRect();
        return { selector, left: rect.left, width: rect.width };
      }),
    };
  });
}

async function checkWidth(page: Page) {
  const metrics = await measure(page);
  expect(metrics.viewport).toHaveLength(1);
  expect(metrics.viewport[0]).toContain("width=device-width");
  expect(metrics.viewport[0]).toContain("initial-scale=1");
  expect(metrics.viewport[0]).toContain("viewport-fit=cover");
  expect(metrics.viewport[0]).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.visual?.scale).toBeCloseTo(1, 2);
  expect(metrics.visual?.width).toBeCloseTo(metrics.width, 0);
  for (const box of metrics.boxes) {
    expect(Math.abs(box.left), box.selector).toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - metrics.width), box.selector).toBeLessThanOrEqual(1);
  }
  return metrics;
}

test.use({ reducedMotion: "reduce", colorScheme: "dark" });
test.setTimeout(90_000);

test("page and hero fill the viewport through rotation and reload", async ({ page }, testInfo) => {
  const samples = [];
  for (const viewport of [
    { width: 430, height: 932 },
    { width: 932, height: 430 },
    { width: 932, height: 350 },
    { width: 932, height: 430 },
    { width: 740, height: 350 },
    { width: 430, height: 740 },
  ]) {
    await page.setViewportSize(viewport);
    if (!samples.length) await page.goto("/");
    await ready(page);
    samples.push({ state: "resize", ...viewport, ...(await checkWidth(page)) });
    await page.reload();
    await ready(page);
    samples.push({ state: "reload", ...viewport, ...(await checkWidth(page)) });
  }
  await testInfo.attach("viewport-metrics", {
    body: JSON.stringify(samples, null, 2),
    contentType: "application/json",
  });
});

async function ready(page: Page) {
  await expect(page.locator("#hero")).toBeVisible();
  await expect(page.locator("#hero h1 > span").first()).toHaveCSS("opacity", "1", {
    timeout: 15_000,
  });
  await page.evaluate(() => document.fonts.ready);
}

// The portrait hero is at least min(screen, 44rem) tall (Hero.tsx, since 2026-11-06), so on a tall
// phone the next section may peek in under it. It must still not shift its heading with the screen.
const PORTRAIT_HERO_FLOOR = 44 * 16;

test("portrait hero keeps its height floor without shifting its heading", async ({ page }) => {
  const samples = [];
  for (const height of [932, 740]) {
    await page.setViewportSize({ width: 430, height });
    if (!samples.length) await page.goto("/");
    await ready(page);
    samples.push(
      await page.evaluate(() => {
        const hero = document.querySelector("#hero")!.getBoundingClientRect();
        const heading = document.querySelector("#hero h1")!.getBoundingClientRect();
        const cue = document
          .querySelector('#hero a[href="#projects"][aria-label]')!
          .getBoundingClientRect();
        const roles = document.querySelector("#hero .site-container")!.getBoundingClientRect();
        return {
          viewportHeight: window.innerHeight,
          heroBottom: hero.bottom,
          headingTop: heading.top - hero.top,
          heroHeight: hero.height,
          cueTop: cue.top - hero.top,
          cueBottom: cue.bottom - hero.top,
          contentBottom: roles.bottom - hero.top,
        };
      }),
    );
  }
  expect(Math.abs(samples[0].headingTop - samples[1].headingTop)).toBeLessThanOrEqual(1);
  for (const sample of samples) {
    const floor = Math.min(sample.viewportHeight, PORTRAIT_HERO_FLOOR);
    expect(sample.heroHeight).toBeGreaterThanOrEqual(floor - 1);
    expect(sample.heroBottom).toBeGreaterThanOrEqual(floor - 1);
    expect(sample.cueTop).toBeGreaterThanOrEqual(sample.contentBottom);
    expect(sample.cueBottom).toBeLessThan(sample.heroHeight);
  }
});
