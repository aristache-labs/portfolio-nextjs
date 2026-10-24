import { expect, test, type Page } from "@playwright/test";

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

test("portrait screen floor is applied before hydration", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Physical screen floor applies to touch phones only");
  await page.setViewportSize({ width: 430, height: 745 });
  await page.addInitScript(() => {
    Object.defineProperty(screen, "height", { value: 932 });
  });
  // Keep inline pre-paint scripts, but prevent the React application from hydrating.
  await page.route(/\/_next\/.*\.js(?:\?|$)/, (route) => route.abort());
  await page.goto("/");
  const before = await page.locator("#hero").evaluate((element) => ({
    height: Number.parseFloat(getComputedStyle(element).minHeight),
    floor: getComputedStyle(document.documentElement).getPropertyValue("--portrait-screen-height"),
    screenHeight: screen.height,
  }));
  expect(before.floor).toBe(`${before.screenHeight}px`);
  expect(before.height).toBeGreaterThanOrEqual(before.screenHeight - 1);
});

async function ready(page: Page) {
  await expect(page.locator("#hero h1 > span").first()).toHaveCSS("opacity", "1", {
    timeout: 15_000,
  });
  await page.evaluate(() => document.fonts.ready);
}

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

test("portrait hero fills the first screen without shifting its heading", async ({ page }) => {
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
        const roles = document.querySelector("#hero > .site-container")!.getBoundingClientRect();
        return {
          viewportHeight: window.innerHeight,
          screenFloor: matchMedia("(pointer: coarse)").matches ? screen.height : 0,
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
    expect(sample.heroHeight).toBeGreaterThanOrEqual(sample.viewportHeight - 1);
    expect(sample.heroHeight).toBeGreaterThanOrEqual(sample.screenFloor - 1);
    expect(sample.heroBottom).toBeGreaterThanOrEqual(sample.viewportHeight - 1);
    expect(sample.cueTop).toBeGreaterThanOrEqual(sample.contentBottom);
    expect(sample.cueBottom).toBeLessThan(sample.heroHeight);
  }
});
