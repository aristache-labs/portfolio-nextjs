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

test.describe("About fold viewport", () => {
  for (const hasTouch of [false, true]) {
    test.describe(hasTouch ? "touch" : "desktop emulation", () => {
      test.use({ hasTouch });
      for (const [width, height] of [
        [836, 842],
        [842, 836],
        [860, 744],
        [744, 860],
      ]) {
        test(`${width}x${height}: side portrait stays visible and columns enter from the right`, async ({
          page,
        }) => {
          await open(page, width, height);
          await page.getByRole("button", { name: "Open menu", exact: true }).click();
          const link = page.locator('header a[href="#about"]:visible');
          test.skip((await link.count()) === 0, "About is hidden in section visibility settings");
          await link.first().click();
          await page.waitForTimeout(1400);
          const section = page.locator("#about");
          expect(
            await section.evaluate((node) => {
              const portrait = node
                .querySelector('[class*="biography"] > [class*="portrait"]')!
                .getBoundingClientRect();
              const intro = node
                .querySelector('[class*="biography"] > [class*="introduction"]')!
                .getBoundingClientRect();
              return portrait.left >= intro.right && portrait.top < intro.bottom;
            }),
          ).toBe(true);
          const biography = await section.locator('[class*="copy"]').evaluate((node) => {
            const full = node.firstElementChild!;
            return {
              visible: getComputedStyle(full).display !== "none",
              columns: getComputedStyle(full).columnCount,
            };
          });
          expect(biography).toEqual({ visible: true, columns: "2" });
          const start = await section.evaluate(
            (node) => scrollY + node.getBoundingClientRect().top - innerHeight * 0.8,
          );
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start);
          let previousMask = 100;
          for (let step = 0; step <= 7; step++) {
            await page.evaluate(
              (y) => window.scrollTo({ top: y, behavior: "instant" }),
              start + step * 100,
            );
            await page.waitForTimeout(1400);
            const sample = await section.evaluate((node) => {
              const portrait = node.querySelector('[class*="biography"] > [class*="portrait"]')!;
              const reveal = portrait.firstElementChild!;
              const paragraphs = [...node.querySelectorAll<HTMLElement>('[class*="details"] p')];
              return {
                opacity: Number(getComputedStyle(portrait).opacity),
                bottomClip: parseFloat(
                  getComputedStyle(reveal).clipPath.slice(6, -1).split(/\s+/)[2] || "0",
                ),
                mask: parseFloat(getComputedStyle(reveal).clipPath.slice(6) || "0"),
                columns: paragraphs.map(
                  (p) => new DOMMatrixReadOnly(getComputedStyle(p).transform).m41,
                ),
                overflow:
                  document.documentElement.scrollWidth - document.documentElement.clientWidth,
              };
            });
            expect(sample.opacity).toBe(1);
            expect(sample.bottomClip).toBe(0);
            expect(sample.mask).toBeLessThanOrEqual(previousMask + 0.1);
            previousMask = sample.mask;
            expect(sample.columns.every((x) => x >= -0.1)).toBe(true);
            expect(sample.overflow).toBeLessThanOrEqual(1);
          }
          expect(previousMask).toBeLessThan(1);
        });
      }
    });
  }
});

test.describe("About fold layout isolation", () => {
  test.use({ hasTouch: true });

  test("other portrait sizes retain the stacked layout, including the withdrawn 344px case", async ({
    page,
  }) => {
    for (const [width, height] of [
      [320, 568],
      [344, 882],
      [360, 780],
      [744, 1133],
      [820, 1180],
    ]) {
      await open(page, width, height);
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const link = page.locator('header a[href="#about"]:visible');
      test.skip((await link.count()) === 0, "About is hidden in section visibility settings");
      await link.first().click();
      await page.waitForTimeout(1400);
      expect(
        await page.locator("#about").evaluate((node) => {
          const portrait = node
            .querySelector('[class*="biography"] > [class*="portrait"]')!
            .getBoundingClientRect();
          const intro = node
            .querySelector('[class*="biography"] > [class*="introduction"]')!
            .getBoundingClientRect();
          return portrait.left < intro.right && portrait.right > intro.left;
        }),
      ).toBe(true);
    }
  });

  test("near-square reduced motion retains the lateral layout without a reveal mask", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [width, height] of [
      [836, 842],
      [842, 836],
      [860, 744],
      [744, 860],
    ]) {
      await open(page, width, height);
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const link = page.locator('header a[href="#about"]:visible');
      test.skip((await link.count()) === 0, "About is hidden in section visibility settings");
      await link.first().click();
      const portrait = page.locator('#about [class*="biography"] > [class*="portrait"]');
      await expect(portrait.locator(":scope > div")).toHaveCSS("clip-path", "none");
      expect(
        await page.locator("#about").evaluate((node) => {
          const avatar = node
            .querySelector('[class*="biography"] > [class*="portrait"]')!
            .getBoundingClientRect();
          const intro = node
            .querySelector('[class*="biography"] > [class*="introduction"]')!
            .getBoundingClientRect();
          return avatar.left >= intro.right;
        }),
      ).toBe(true);
    }
  });
});

test.describe("Fold menu landscape layout", () => {
  test.use({ hasTouch: true });

  for (const [width, height] of [
    [860, 744],
    [744, 860],
    [836, 842],
    [842, 836],
  ]) {
    test(`${width}x${height}: menu uses two link columns and a side action`, async ({ page }) => {
      await open(page, width, height);
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const panel = page.locator("#mobile-navigation");
      await expect(panel).toBeVisible();
      await page.waitForTimeout(1400);
      const layout = await panel.evaluate((node) => {
        const links = [
          ...node.querySelectorAll<HTMLElement>('[data-testid="mobile-section-link"]'),
        ];
        const first = links[0].getBoundingClientRect();
        const second = links[1].getBoundingClientRect();
        const nav = node.querySelector("nav")!.getBoundingClientRect();
        const action = node.querySelector<HTMLElement>('[class*="action"]');
        const heights = links.map((link) => {
          const box = link.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const centerY = box.top + box.height / 2;
          let height = 1;
          for (const direction of [-1, 1]) {
            for (let distance = 1; distance <= 40; distance++) {
              const hit = document.elementFromPoint(x, centerY + direction * distance);
              if (!hit || !(hit === link || link.contains(hit))) break;
              height++;
            }
          }
          return height;
        });
        return {
          sameRow: Math.abs(first.top - second.top) <= 1 && second.left > first.right,
          sideAction: !action || action.getBoundingClientRect().left >= nav.right,
          fits:
            node.getBoundingClientRect().bottom <= innerHeight &&
            node.scrollHeight <= node.clientHeight + 1,
          heights,
        };
      });
      expect(layout.sameRow).toBe(true);
      expect(layout.sideAction).toBe(true);
      expect(layout.fits).toBe(true);
      expect(layout.heights.every((height) => height >= 44)).toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  }
});

test.describe("About landscape statistics", () => {
  test.use({ hasTouch: true });

  for (const [width, height] of [
    [667, 375],
    [780, 360],
    [932, 430],
  ]) {
    test(`${width}x${height}: the panel stays solid during entrance`, async ({ page }) => {
      await open(page, width, height);
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const link = page.locator('header a[href="#about"]:visible');
      test.skip((await link.count()) === 0, "About is hidden in section visibility settings");
      await link.first().click();
      await page.waitForTimeout(1400);
      const samples = await page.locator('#about [class*="results"]').evaluate(async (results) => {
        const panel = results.querySelector<HTMLElement>('[class*="panel"]')!;
        const probe = document.createElement("span");
        probe.style.backgroundColor = "var(--surface)";
        panel.append(probe);
        const solid = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const rect = results.getBoundingClientRect();
        const destination = scrollY + rect.top - innerHeight * 0.6;
        const readings: { solid: boolean; opacity: number }[] = [];
        const start = performance.now();
        window.scrollTo({ top: destination, behavior: "instant" });
        await new Promise<void>((resolve) => {
          const sample = () => {
            let opacity = 1;
            for (
              let node: Element | null = panel;
              node && node.id !== "about";
              node = node.parentElement
            ) {
              opacity *= Number(getComputedStyle(node).opacity);
            }
            readings.push({ solid: getComputedStyle(panel).backgroundColor === solid, opacity });
            if (performance.now() - start < 1400) requestAnimationFrame(sample);
            else resolve();
          };
          requestAnimationFrame(sample);
        });
        return readings;
      });
      expect(samples.length).toBeGreaterThan(1);
      expect(samples.every((sample) => sample.solid && sample.opacity >= 0.999)).toBe(true);
    });
  }
});

test.describe("About biography touch target", () => {
  test.use({ hasTouch: true });

  for (const [width, height] of [
    [375, 667],
    [744, 1133],
    [740, 350],
  ]) {
    test(`${width}x${height}: expanded and collapsed controls have a 44px touch target`, async ({
      page,
    }) => {
      await open(page, width, height);
      const link = page.locator('header a[href="#about"]:visible');
      const menu = page.getByRole("button", { name: "Open menu", exact: true });
      await expect(menu).toBeVisible();
      await menu.click();
      test.skip((await link.count()) === 0, "About is hidden in section visibility settings");
      await link.first().click();
      await page.waitForTimeout(1400);
      const toggle = page.locator("#about button[aria-expanded]");
      test.skip((await toggle.count()) === 0, "Biography has no expandable content");
      for (const expanded of [false, true]) {
        await expect(toggle).toHaveAttribute("aria-expanded", String(expanded));
        await toggle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1400);
        await expect
          .poll(() =>
            toggle.evaluate((node) => {
              const rect = node.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const centerHit = document.elementFromPoint(x, centerY);
              if (!centerHit || !(centerHit === node || node.contains(centerHit))) return 0;
              let reach = 1;
              for (const direction of [-1, 1]) {
                for (let step = 1; step <= 60; step++) {
                  const y = centerY + direction * step;
                  const hit = document.elementFromPoint(x, y);
                  if (!hit || !(hit === node || node.contains(hit))) break;
                  reach += 1;
                }
              }
              return reach;
            }),
          )
          .toBeGreaterThanOrEqual(44);
        await toggle.tap();
        await expect(toggle).toHaveAttribute("aria-expanded", String(!expanded));
      }
    });
  }
});

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
