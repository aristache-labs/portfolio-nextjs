import { expect, test, type Page } from "./fixtures";

async function scrollSections(page: Page) {
  const sections = page.locator("main section[id]");
  for (let index = 0; index < (await sections.count()); index++) {
    await sections.nth(index).scrollIntoViewIfNeeded();
  }
}

test("does not load Google with legacy accepted consent", async ({ page }) => {
  const requests: string[] = [];
  await page.addInitScript(() => localStorage.setItem("analytics-consent-v1", "accepted"));
  await page.route(/https:\/\/[^/]*(googletagmanager\.com|google-analytics\.com)\//, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto("/");
  await expect(page.locator("#hero")).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie preferences" })).toBeVisible();
  await scrollSections(page);
  await expect(page.getByRole("button", { name: "Cookie settings", exact: true })).toBeAttached();
  expect(requests).toEqual([]);
  await page.goto("/privacy");
  await expect(page.locator("#analytics")).toContainText("Google Analytics 4");
  expect(requests).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 667, height: 375 },
  { width: 932, height: 430 },
]) {
  test.describe(`touch viewport ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });
    test("uses one poster and animates only the landscape hero", async ({ page }) => {
      const videoRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname.endsWith(".mp4")) videoRequests.push(request.url());
      });
      await page.goto("/");
      await expect(page.locator("#hero")).toBeVisible();
      await expect(page.locator('#hero picture img[fetchpriority="high"]')).toHaveCount(1);
      if (viewport.width > viewport.height) {
        const heroVideo = page.locator("#hero video");
        await expect(heroVideo).toBeVisible();
        await expect
          .poll(() => heroVideo.evaluate((node) => (node as HTMLVideoElement).paused))
          .toBe(false);
        await page.getByRole("button", { name: "Pause background video" }).click();
        await expect
          .poll(() => heroVideo.evaluate((node) => (node as HTMLVideoElement).paused))
          .toBe(true);
        await page.setViewportSize({ width: 430, height: 932 });
        await expect(heroVideo).toHaveCount(0);
        await page.setViewportSize(viewport);
        await expect(heroVideo).toBeVisible();
      }
      await scrollSections(page);
      await expect(page.locator("section:not(#hero) video")).toHaveCount(0);
      if (viewport.width < viewport.height) {
        await expect(page.locator("video")).toHaveCount(0);
        expect(videoRequests).toEqual([]);
      } else {
        expect(videoRequests.length).toBeGreaterThan(0);
        expect(videoRequests.every((url) => new URL(url).pathname === "/media/hero-v2.mp4")).toBe(
          true,
        );
      }
    });
  });
}

test.describe("reduced motion", () => {
  test.use({
    reducedMotion: "reduce",
    viewport: { width: 932, height: 430 },
    isMobile: true,
    hasTouch: true,
  });
  test("shows posters throughout the page without requesting video", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith(".mp4")) requests.push(request.url());
    });
    await page.goto("/");
    await expect(page.locator("#hero")).toBeVisible();
    await scrollSections(page);
    await expect(page.locator("video")).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});

test("below-fold desktop video waits for visibility and pauses offscreen", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/about-v3.mp4")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("#hero")).toBeVisible();
  await expect(page.locator("footer")).toBeAttached();
  test.skip((await page.locator("#about").count()) === 0, "About is hidden in admin settings");
  const video = page.locator("#about video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).not.toHaveAttribute("poster");
  expect(requests).toEqual([]);
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((node) => (node as HTMLVideoElement).paused)).toBe(false);
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((node) => (node as HTMLVideoElement).paused)).toBe(true);
});
