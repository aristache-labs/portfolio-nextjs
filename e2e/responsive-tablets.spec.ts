import { expect, test, type Page } from "./fixtures";

// Phones and tablets in both orientations. Sizes are CSS pixels.
const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "Galaxy S23", width: 360, height: 780 },
  { name: "iPad mini", width: 744, height: 1133 },
  { name: "iPad Air", width: 820, height: 1180 },
  { name: "iPad Pro 12.9", width: 1024, height: 1366 },
  { name: "Galaxy Tab", width: 800, height: 1280 },
].flatMap(({ name, width, height }) => [
  { name: `${name} portrait`, width, height },
  { name: `${name} landscape`, width: height, height: width },
]);

test.use({ colorScheme: "dark" });
test.setTimeout(120_000);

async function open(page: Page, width: number, height: number) {
  await page.addInitScript(() => {
    // Keep the consent banner out of the way; it is not what these specs measure.
    localStorage.setItem("analytics-consent-v2", "rejected");
    sessionStorage.setItem("aristache:rotate-hint", "1");
  });
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await expect(page.locator("#hero")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test("no horizontal overflow on phones and tablets in either orientation", async ({ page }) => {
  const overflowing: string[] = [];
  for (const viewport of VIEWPORTS) {
    await open(page, viewport.width, viewport.height);
    const extra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (extra > 1)
      overflowing.push(`${viewport.name} (${viewport.width}x${viewport.height}): +${extra}px`);
  }
  expect(overflowing).toEqual([]);
});

test.describe("Skills quote card keeps clear of the subtitle", () => {
  for (const [width, height] of [
    [1133, 744],
    [1180, 820],
    [1280, 800],
    [1366, 1024],
  ]) {
    test(`${width}x${height}`, async ({ page }) => {
      await open(page, width, height);
      const subtitle = page.getByText(
        "Infrastructure on one side, web and mobile development on the other.",
      );
      await subtitle.scrollIntoViewIfNeeded();
      await expect(subtitle).toBeVisible();
      const clash = await subtitle.evaluate((node) => {
        const quote = document.querySelector("#skills blockquote")!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()].some(
          (line) =>
            line.right > quote.left &&
            line.left < quote.right &&
            line.bottom > quote.top &&
            line.top < quote.bottom,
        );
      });
      expect(clash, "a subtitle line runs under the quote card").toBe(false);
    });
  }
});

test.describe("Hero copy stays to the left of the subject on portrait tablets", () => {
  for (const [width, height] of [
    [820, 1180],
    [800, 1280],
    [1024, 1366],
  ]) {
    test(`${width}x${height}`, async ({ page }) => {
      await open(page, width, height);
      const copy = page.locator('#hero p[class*="copy"]').first();
      await expect(copy).toBeVisible();
      const box = await copy.boundingBox();
      // 25rem, or 52% of the screen when that is narrower.
      expect(box!.width).toBeLessThanOrEqual(Math.min(400, width * 0.52) + 1);
    });
  }
});

test("header links on a landscape tablet have a touch target of at least 40px", async ({
  page,
}) => {
  await open(page, 1366, 1024);
  const links = page.locator("header ul a");
  await expect(links.first()).toBeVisible();
  // The intro curtain can sit over the header for a moment; measure once the link takes hits.
  await page.waitForFunction(() => {
    const link = document.querySelector("header ul a");
    if (!link) return false;
    const rect = link.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === link || link.contains(hit);
  });
  const short = await links.evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      let reach = rect.height;
      for (const direction of [-1, 1]) {
        for (let step = 1; step <= 30; step++) {
          const y = direction < 0 ? rect.top - step : rect.bottom + step;
          const hit = document.elementFromPoint(x, y);
          if (!hit || !(hit === node || node.contains(hit))) break;
          reach += 1;
        }
      }
      return reach < 40 ? [`${node.textContent}: ${Math.round(reach)}px`] : [];
    }),
  );
  expect(short).toEqual([]);
});
