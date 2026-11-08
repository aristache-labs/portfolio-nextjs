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
  { name: "iPad mini simulator", width: 768, height: 1024 },
  { name: "iPad mini browser bars", width: 768, height: 948 },
  { name: "iPad Pro 11", width: 834, height: 1194 },
  { name: "iPad Pro 11 simulator", width: 834, height: 1210 },
  { name: "iPad Pro 13 simulator", width: 1023, height: 1376 },
  { name: "Galaxy Tab S9 Ultra", width: 1120, height: 1792 },
  { name: "Fold compact", width: 690, height: 829 },
  { name: "Fold", width: 836, height: 842 },
  { name: "Fold tall", width: 744, height: 860 },
].flatMap(({ name, width, height }) => [
  { name: `${name} portrait`, width, height },
  { name: `${name} landscape`, width: height, height: width },
]);

test.use({ colorScheme: "dark" });
test.setTimeout(120_000);

test.describe("Fold whole-page landscape behavior", () => {
  test.use({ hasTouch: true });
  test.setTimeout(180_000);

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    for (const [width, height] of [
      [744, 860],
      [836, 842],
    ]) {
      test(`${width}x${height}: sections, motion and dialogs match tall landscape (${reducedMotion})`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion });
        await open(page, width, height);
        await page.waitForTimeout(2000);
        const hasAbout = (await page.locator("#about").count()) > 0;
        expect
          .soft(await page.locator("#hero").getAttribute("data-touch-scene"))
          .toBe(reducedMotion === "reduce" || !hasAbout ? null : "true");
        for (const id of ["about", "skills", "experience", "projects", "services", "contact"]) {
          await page.getByRole("button", { name: "Open menu", exact: true }).click();
          const link = page.locator(`header a[href="#${id}"]:visible`).first();
          if (!(await link.count())) {
            await page.getByRole("button", { name: "Close menu", exact: true }).click();
            continue;
          }
          await link.tap();
          await page.waitForTimeout(1400);
          const section = page.locator(`#${id}`);
          // Sections clip poster overscan and offscreen entrance positions.
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect.soft(overflow, `${id} overflows horizontally`).toBeLessThanOrEqual(1);
          if (id === "skills") {
            await expect
              .soft(section.locator('[class*="mobileDescription"]'))
              .toHaveCSS("display", "none");
            await expect.soft(section.locator("[data-kind]")).toHaveCount(0);
            const tabs = section.getByRole("tab");
            if ((await tabs.count()) > 1) {
              await tabs.nth(1).tap();
              await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
              await tabs.first().tap();
            }
          }
          if (id === "experience") {
            await expect.soft(section.locator('[class*="mobileReveal"]')).toHaveCount(0);
            const details = section.locator("details").first();
            if (await details.count()) {
              await details.locator("summary").tap();
              await expect(details).toHaveAttribute("open", "");
              await details.locator("summary").tap();
            }
          }
          if (id === "projects") {
            await expect.soft(section.locator("[data-project-reveal]")).toHaveCount(0);
            const highlights = section.locator('[class*="highlights"]').first();
            if (await highlights.count()) {
              expect
                .soft(
                  await highlights.evaluate(
                    (node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length,
                  ),
                )
                .toBe(1);
              const stack = highlights.locator('[class*="stack"]').first();
              if (await stack.count()) await expect.soft(stack).toHaveCSS("flex-direction", "row");
            }
            const preview = section.locator('button[aria-label^="View "]').first();
            if (await preview.count()) {
              const title = (await preview.getAttribute("aria-label"))!.slice(5);
              await preview.tap();
              const dialog = page.getByRole("dialog");
              await expect(dialog).toBeVisible();
              await expect(dialog).toHaveAccessibleName(title);
              await page.waitForTimeout(1400);
              expect
                .soft(
                  await dialog.evaluate((node) => {
                    const box = node.getBoundingClientRect();
                    return (
                      box.left >= 0 &&
                      box.right <= innerWidth &&
                      box.top >= 0 &&
                      box.bottom <= innerHeight &&
                      [...node.querySelectorAll("button, a")].every((control) => {
                        const bounds = control.getBoundingClientRect();
                        return bounds.left >= 0 && bounds.right <= innerWidth;
                      })
                    );
                  }),
                )
                .toBe(true);
              expect
                .soft(
                  await dialog
                    .locator('[class*="shortLabel"]')
                    .evaluateAll((nodes) =>
                      nodes.every((node) => getComputedStyle(node).display === "none"),
                    ),
                )
                .toBe(true);
              await page.keyboard.press("Escape");
              await expect(dialog).toBeHidden();
            }
          }
          if (id === "services") {
            if (!(await section.locator('[class*="grid"]').count())) continue;
            expect
              .soft(
                await section
                  .locator('[class*="grid"]')
                  .first()
                  .evaluate(
                    (node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length,
                  ),
              )
              .toBe(2);
          }
          if (id === "contact") {
            await expect.soft(section.locator("[data-contact-kind]")).toHaveCount(0);
            await expect
              .poll(() =>
                section.locator("h2").evaluate((heading) => {
                  let node: Element | null = heading;
                  while (node && node.id !== "contact") {
                    if (Number(getComputedStyle(node).opacity) < 0.99) return false;
                    node = node.parentElement;
                  }
                  return true;
                }),
              )
              .toBe(true);
            const input = section.locator('input[type="email"]');
            if (await input.count()) {
              await input.focus();
              await expect(input).toBeFocused();
            }
          }
        }
        await page.evaluate(() =>
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
        );
        await page.waitForTimeout(1400);
        const footer = page.locator("footer");
        expect
          .soft(
            await footer
              .locator('[class*="columns"]')
              .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length),
          )
          .toBe(3);
        expect
          .soft(
            await footer
              .locator('[class*="legal"]')
              .filter({ has: page.locator("p") })
              .last()
              .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length),
          )
          .toBe(2);
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        await page.locator('header a[href="#hero"]:visible').first().tap();
        await page.waitForTimeout(1400);
        await expect(page.locator("#hero h1")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});

test.describe("Fold Projects layout", () => {
  test.use({ hasTouch: true });
  for (const [width, height] of [
    [690, 829],
    [829, 690],
    [701, 841],
    [744, 860],
    [860, 744],
    [836, 842],
    [842, 836],
  ]) {
    test(`${width}x${height}: Featured swipes, More projects has two columns and Building now sits beside the heading`, async ({
      page,
    }) => {
      await open(page, width, height);
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const link = page.locator('header a[href="#projects"]:visible').first();
      test.skip(!(await link.count()), "Projects is hidden in site settings");
      await link.tap();
      await page.waitForTimeout(1400);
      const section = page.locator("#projects");
      for (const selector of ['[class*="highlights"]', '[class*="projectGrid"]']) {
        const grid = section.locator(selector).first();
        if (await grid.count()) {
          expect
            .soft(
              await grid.evaluate(
                (node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length,
              ),
            )
            .toBe(selector.includes("projectGrid") ? 2 : 1);
        }
      }
      const stack = section.locator('[class*="highlights"] [class*="stack"]').first();
      if (await stack.count()) {
        await expect.soft(stack).toHaveCSS("flex-direction", "row");
        await expect.soft(stack).toHaveCSS("overflow-x", "auto");
        await expect.soft(stack).toHaveCSS("scroll-snap-type", "x mandatory");
      }
      const building = section.locator('[class*="currently-building"][class*="slot"]');
      if (await building.count()) {
        const bounds = await building.boundingBox();
        expect.soft(bounds!.x, "Building now sits on the right").toBeGreaterThan(width / 2);
        expect.soft(bounds!.width).toBeLessThanOrEqual(300);
        expect
          .soft(bounds!.width)
          .toBeGreaterThanOrEqual(width >= 740 && width < height ? 240 : 260);
        await building.locator('button[aria-label^="Open "]').tap();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
      }
      const title = section.locator('[class*="recentCard"] h3').first();
      if (await title.count()) {
        expect
          .soft(
            await title.evaluate((node) => ({
              overflow: getComputedStyle(node).textOverflow,
              label: node.getAttribute("title"),
              text: node.textContent,
            })),
          )
          .toEqual({
            overflow: "ellipsis",
            label: await title.textContent(),
            text: await title.textContent(),
          });
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("Short Fold type scale", () => {
  test.use({ hasTouch: true });
  for (const [width, height, maxRoot] of [
    [829, 690, 15],
    [860, 744, 16],
    [690, 829, 16],
  ]) {
    test(`${width}x${height}: the root size follows the height instead of filling the screen`, async ({
      page,
    }) => {
      await open(page, width, height);
      const root = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      expect(root).toBeLessThanOrEqual(maxRoot);
      if (height > 780) expect(root).toBe(16);
      else expect(root).toBeGreaterThanOrEqual(14);
    });
  }
});

test.describe("Fold section backdrops are not stretched", () => {
  test.use({ hasTouch: true });
  for (const [width, height] of [
    [829, 690],
    [690, 829],
    [744, 860],
  ]) {
    test(`${width}x${height}: backdrop plates hold one screen instead of the whole section`, async ({
      page,
    }) => {
      await open(page, width, height);
      const heights = await page.evaluate(() =>
        ["about", "experience", "projects", "contact"].flatMap((id) => {
          const plate = document.querySelector(`#${id} > div[aria-hidden] > div`);
          return plate ? [{ id, height: plate.getBoundingClientRect().height }] : [];
        }),
      );
      for (const { id, height: plateHeight } of heights)
        expect.soft(plateHeight, `${id} backdrop`).toBeLessThanOrEqual(height + 1);
    });
  }
});

test.describe("Short Fold About and Skills remain reachable after menu navigation", () => {
  test.use({ hasTouch: true });
  for (const [width, height] of [
    [829, 690],
    [860, 744],
  ]) {
    test(`${width}x${height}: the results row and icon strip can be reached by scrolling`, async ({
      page,
    }) => {
      await open(page, width, height);
      await page.waitForTimeout(3000);
      for (const id of ["about", "skills"]) {
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        const link = page.locator(`header a[href="#${id}"]:visible`).first();
        test.skip(!(await link.count()), `${id} is hidden in site settings`);
        await link.tap();
        await page.waitForTimeout(2600);
        const bottom = await page.evaluate((sectionId) => {
          const section = document.getElementById(sectionId)!;
          const last = section.querySelector<HTMLElement>(
            sectionId === "about"
              ? '[class*="results"]'
              : '[class*="marquee" i], [class*="Marquee"]',
          );
          return {
            section: section.getBoundingClientRect().bottom,
            last: last ? last.getBoundingClientRect().bottom : null,
            height: innerHeight,
          };
        }, id);
        const last = sectionLast(page, id);
        if (await last.count())
          await last.evaluate((node) =>
            node.scrollIntoView({ block: "center", behavior: "instant" }),
          );
        if (id === "about") {
          const readResults = () =>
            page.evaluate(() => {
              const node = document.querySelector<HTMLElement>('#about [class*="results"]')!;
              const grid = node.querySelector<HTMLElement>("[data-reveal]");
              const style = getComputedStyle(node);
              return {
                opacity: Number(style.opacity),
                settled:
                  style.transform === "none" || style.transform === "matrix(1, 0, 0, 1, 0, 0)",
                reveal: grid?.dataset.reveal ?? null,
              };
            });
          // Bringing the results inside the observer inset starts the counters.
          await expect
            .poll(async () => (await readResults()).settled, { timeout: 5000 })
            .toBe(true);
          await expect.poll(async () => (await readResults()).reveal).not.toBe("armed");
          const results = await readResults();
          expect.soft(results.opacity, "results row is visible after scrolling").toBe(1);
          expect.soft(results.reveal, "counters have started").not.toBe("armed");
        }
        expect
          .soft(bottom.section, `${id} reaches the bottom edge`)
          .toBeGreaterThanOrEqual(bottom.height);
        if (await last.count()) {
          await expect(last).toBeInViewport();
        }
      }
    });
  }
});

test.describe("Skills Fold orbit legibility", () => {
  test.use({ hasTouch: true });
  for (const [width, height] of [
    [829, 690],
    [690, 829],
  ]) {
    test(`${width}x${height}: the orbit stays faint behind the cards`, async ({ page }) => {
      await open(page, width, height);
      const backdrop = page
        .locator('#skills [class*="backdrop"]:not([class*="backdropFrame"])')
        .first();
      test.skip(!(await backdrop.count()), "Skills is hidden in site settings");
      await page.locator("#skills h2").scrollIntoViewIfNeeded();
      await expect
        .poll(() => backdrop.evaluate((node) => Number(getComputedStyle(node).opacity)))
        .toBeLessThanOrEqual(0.31);
    });
  }
});

test.describe("Hero Fold portrait background video", () => {
  test.use({ hasTouch: true });

  test("plays, pauses and resumes in Fold portrait, and preserves static phone and reduced-motion fallbacks", async ({
    page,
  }) => {
    await open(page, 744, 860);
    const video = page.locator("#hero video");
    await expect(video).toHaveCount(1);
    await expect(video).toBeVisible();
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) => node.readyState >= 2 && !node.paused && node.currentTime > 0,
        ),
      )
      .toBe(true);
    const firstTime = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
      .toBeGreaterThan(firstTime);
    const pause = page.getByRole("button", { name: "Pause background video", exact: true });
    await expect(pause).toBeVisible();
    await pause.tap();
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
    await page.getByRole("button", { name: "Play background video", exact: true }).tap();
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(false);
    await page.setViewportSize({ width: 860, height: 744 });
    await expect(video).toBeVisible();
    await page.setViewportSize({ width: 836, height: 842 });
    await expect(video).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(video).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 744, height: 860 });
    await expect(video).toHaveCount(0);
    await expect(page.locator("#hero picture img")).toBeVisible();
  });
});

test.describe("Hero fold content layout", () => {
  test.use({ hasTouch: true });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`744x860 uses landscape content alignment (${reducedMotion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      for (const [width, height] of [
        [744, 860],
        [860, 744],
      ]) {
        await open(page, width, height);
        await page.waitForTimeout(3500);
        const layout = await page.locator("#hero").evaluate((hero) => {
          const style = (name: string) =>
            getComputedStyle(hero.querySelector(`[class*="${name}"]`)!);
          const scene = hero.querySelector('[class*="scene"]')!.getBoundingClientRect();
          const links = hero.querySelector('[class*="secondaryLinks"]')!.getBoundingClientRect();
          const cue = hero.querySelector('[class*="scrollCue"]')!.getBoundingClientRect();
          return {
            roles: style("specialization").textAlign,
            tagline: getComputedStyle(hero.querySelector('[class*="taglineRow"] > span')!)
              .textAlign,
            actions: style("actions").display,
            links: style("secondaryLinks").justifyContent,
            cuePosition: style("scrollCue").position,
            cueFits: cue.bottom <= scene.bottom + 1 && cue.top >= links.bottom - 1,
            copyWidth: hero.querySelector('[class*="copy"]')!.getBoundingClientRect().width,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        expect(layout.roles).toBe("left");
        expect(layout.tagline).toBe("left");
        expect(layout.actions).toBe("flex");
        expect(layout.links).toBe("flex-start");
        expect(layout.cuePosition).toBe("absolute");
        expect(layout.cueFits).toBe(true);
        expect(layout.copyWidth).toBeLessThanOrEqual(Math.min(400, width * 0.52) + 1);
        expect(layout.overflow).toBeLessThanOrEqual(1);
      }
    });
  }

  for (const [width, height] of [
    [829, 690],
    [690, 829],
    [860, 744],
    [832, 750],
  ]) {
    test(`${width}x${height}: scene fits one screen with the cue on screen and links clear of the edge`, async ({
      page,
    }) => {
      await open(page, width, height);
      await page.waitForTimeout(3500);
      const layout = await page.locator("#hero").evaluate((hero) => {
        const box = (name: string) =>
          hero.querySelector(`[class*="${name}"]`)!.getBoundingClientRect();
        const scene = box("scene");
        const links = box("secondaryLinks");
        const cue = box("scrollCue");
        const cueStyle = getComputedStyle(hero.querySelector('[class*="scrollCue"]')!);
        return {
          sceneHeight: scene.height,
          linksGap: scene.bottom - links.bottom,
          cueVisible: cue.top >= 0 && cue.bottom <= innerHeight && cueStyle.display !== "none",
          cueClearsLinks: cue.top >= links.bottom - 1,
        };
      });
      expect(layout.sceneHeight).toBeLessThanOrEqual(height + 1);
      expect(layout.linksGap).toBeGreaterThanOrEqual(64);
      expect(layout.cueVisible).toBe(true);
      expect(layout.cueClearsLinks).toBe(true);
    });
  }

  test("ordinary portrait phone retains its centered supporting content", async ({ page }) => {
    await open(page, 390, 844);
    await expect(page.locator('#hero [class*="specialization"]').first()).toHaveCSS(
      "text-align",
      "center",
    );
    await expect(page.locator('#hero [class*="secondaryLinks"]')).toHaveCSS(
      "justify-content",
      "center",
    );
    await expect(page.locator('#hero [class*="actions"]').first()).toHaveCSS("display", "grid");
  });
});

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
          await expect
            .poll(() =>
              section
                .locator('[class*="biography"] > [class*="portrait"]')
                .evaluate((node) =>
                  (node.firstElementChild as HTMLElement).style.getPropertyValue("--portrait-mask"),
                ),
            )
            .not.toBe("");
          // Real reader input cancels anchor restoration before the reversible scroll check.
          await section.dispatchEvent("pointerdown", {
            pointerType: hasTouch ? "touch" : "mouse",
          });
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
            await expect
              .poll(async () =>
                Math.abs((await page.evaluate(() => scrollY)) - (start + step * 100)),
              )
              .toBeLessThanOrEqual(1);
            await page.waitForTimeout(1400);
            const sample = await section.evaluate((node) => {
              const portrait = node.querySelector('[class*="biography"] > [class*="portrait"]')!;
              const reveal = portrait.firstElementChild!;
              const paragraphs = [...node.querySelectorAll<HTMLElement>('[class*="details"] p')];
              return {
                visible:
                  portrait.getBoundingClientRect().top < innerHeight &&
                  portrait.getBoundingClientRect().bottom > 0,
                opacity: Number(getComputedStyle(portrait).opacity),
                scroll: scrollY,
                top: portrait.getBoundingClientRect().top,
                clip: getComputedStyle(reveal).clipPath,
                paintedMask: (reveal as HTMLElement).style.getPropertyValue("--portrait-mask"),
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
            expect(sample.bottomClip).toBeLessThanOrEqual(previousMask + 0.1);
            previousMask = sample.bottomClip;
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

test.describe("Fold menu layout", () => {
  test.use({ hasTouch: true });

  for (const [width, height] of [
    [860, 744],
    [744, 860],
    [836, 842],
    [842, 836],
  ]) {
    test(`${width}x${height}: menu uses one link column and an action below`, async ({ page }) => {
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
          singleColumn: second.top >= first.bottom && Math.abs(first.left - second.left) <= 1,
          actionBelow: !action || action.getBoundingClientRect().top >= nav.bottom,
          fits:
            node.getBoundingClientRect().bottom <= innerHeight &&
            node.scrollHeight <= node.clientHeight + 1,
          heights,
        };
      });
      expect(layout.singleColumn).toBe(true);
      expect(layout.actionBelow).toBe(true);
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
  // The server renders /# links; # links confirm that client navigation has hydrated.
  await expect(page.locator('header a[aria-label="Home"]')).toHaveAttribute("href", "#hero");
}

test("no horizontal overflow on phones and tablets in either orientation", async ({ page }) => {
  const overflowing: string[] = [];
  await open(page, VIEWPORTS[0].width, VIEWPORTS[0].height);
  for (const viewport of VIEWPORTS) {
    await test.step(`${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      // Exercise live rotation without repeating the document load and hydration 32 times.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const extra = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (extra > 1)
        overflowing.push(`${viewport.name} (${viewport.width}x${viewport.height}): +${extra}px`);
    });
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
      // Air and Tab S7 use the accepted padded 27rem paragraph; Pro 13 keeps 52vw.
      const limit = width < 1000 ? Math.min(432, width * 0.54) : width * 0.52;
      expect(box!.width).toBeLessThanOrEqual(limit + 1);
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

// Check each viewport independently so failures name the actual device and pointer.
for (const hasTouch of [true, false]) {
  test.describe(`Tablet regression matrix (${hasTouch ? "coarse" : "fine"})`, () => {
    test.use({ hasTouch });
    for (const viewport of VIEWPORTS.filter((v) => v.width >= 650 && v.height >= 650)) {
      test(`${viewport.name}: sections and controls stay within the viewport`, async ({ page }) => {
        await open(page, viewport.width, viewport.height);
        expect(
          await page.evaluate(() => ({
            width: innerWidth,
            height: innerHeight,
            coarse: matchMedia("(pointer: coarse)").matches,
          })),
        ).toEqual({ width: viewport.width, height: viewport.height, coarse: hasTouch });
        for (const id of ["hero", "about", "skills", "experience", "projects", "contact"]) {
          const section = page.locator(`#${id}`);
          if (!(await section.count())) {
            test.info().annotations.push({ type: "missing-section", description: id });
            continue;
          }
          await section.scrollIntoViewIfNeeded();
          await expect(section).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate(
                () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
              ),
            )
            .toBeLessThanOrEqual(1);
          const heading = section.locator("h1, h2").first();
          await expect(heading).toBeVisible();
          await expect
            .poll(
              async () => {
                const box = await heading.boundingBox();
                return !!box && box.x >= -1 && box.x + box.width <= viewport.width + 1;
              },
              { message: `${id} heading settles within the viewport` },
            )
            .toBe(true);
          if (id === "skills") {
            const tabs = section.getByRole("tab");
            if ((await tabs.count()) > 1) {
              await tabs.nth(1).scrollIntoViewIfNeeded();
              await page.evaluate(
                () =>
                  new Promise<void>((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
                  ),
              );
              await tabs.nth(1).click();
              await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
              await tabs.first().click();
            }
          }
          if (id === "contact") {
            const email = section.locator('input[type="email"]');
            if (await email.count()) {
              await email.focus();
              await expect(email).toBeFocused();
            }
          }
        }
        await page.locator("footer").scrollIntoViewIfNeeded();
        await expect(page.locator("footer")).toBeVisible();
      });
    }
  });
}

for (const hasTouch of [true, false]) {
  test.describe(`Accepted tablet Projects layouts (${hasTouch ? "coarse" : "fine"})`, () => {
    test.use({ hasTouch });
    for (const [width, height, columns] of [
      [690, 829, 2],
      [829, 690, 2],
      [744, 860, 2],
      [860, 744, 2],
      [836, 842, 2],
      [842, 836, 2],
      [768, 1024, 1],
      [768, 948, 1],
      [820, 1180, 1],
      [834, 1194, 1],
      [834, 1210, 1],
      [1023, 1376, 1],
      [1024, 1366, 1],
      [800, 1280, 2],
      [1120, 1792, 2],
    ]) {
      test(`${width}x${height}: Latest work and More projects columns`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open(page, width, height);
        const section = page.locator("#projects");
        test.skip(!(await section.count()), "Projects is hidden in site settings");
        await section.scrollIntoViewIfNeeded();
        const latest = section.locator('[class*="recentTrack"]').first();
        test.skip(!(await latest.count()), "No Latest work data");
        await expect
          .poll(() =>
            latest.evaluate(
              (node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length,
            ),
          )
          .toBe(columns);
        await expect
          .poll(() => latest.locator('article[class*="recentCard"]').count())
          .toBeLessThanOrEqual(4);
        const more = section.locator('[class*="projectGrid"]').first();
        if (await more.count()) {
          await expect
            .poll(() =>
              more.evaluate(
                (node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).length,
              ),
            )
            .toBe(2);
        }
      });
    }
  });
}

for (const hasTouch of [true, false]) {
  test.describe(`Ultra legal layouts (${hasTouch ? "coarse" : "fine"})`, () => {
    test.use({ hasTouch });
    for (const [width, height] of [
      [1120, 1792],
      [1792, 1120],
    ]) {
      for (const route of ["/privacy", "/gdpr"]) {
        test(`${route} ${width}x${height}: contents and solid panel`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await open(page, width, height);
          await page.goto(route);
          const nav = page.getByRole("navigation", {
            name: route === "/privacy" ? "Privacy page contents" : "GDPR page contents",
          });
          await expect(nav).toBeVisible();
          const details = nav.locator("details");
          if (width < height) {
            await expect(details).toBeVisible();
            await details.locator("summary").click();
            await expect(details).toHaveAttribute("open", "");
            await expect(nav).toHaveCSS("position", "static");
          } else {
            await expect(details).toBeHidden();
            await expect(nav).toHaveCSS("position", "sticky");
          }
          const panel = nav.locator("..").locator(":scope > div").last();
          await expect(panel).toHaveCSS("backdrop-filter", "none");
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
          ).toBeLessThanOrEqual(1);
        });
      }
    }
  });
}

function sectionLast(page: Page, id: string) {
  return page
    .locator(`#${id}`)
    .locator(id === "about" ? '[class*="results"]' : '[class*="marquee" i]')
    .first();
}

for (const hasTouch of [true, false]) {
  test.describe(`Ultra motion and navigation (${hasTouch ? "coarse" : "fine"})`, () => {
    test.use({ hasTouch });
    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      for (const [width, height] of [
        [1120, 1792],
        [1792, 1120],
      ]) {
        test(`${width}x${height} ${reducedMotion}: menu landing and dialog fit`, async ({
          page,
        }) => {
          await page.emulateMedia({ reducedMotion });
          await open(page, width, height);
          const menu = page.getByRole("button", { name: "Open menu", exact: true });
          for (const id of ["about", "skills", "experience", "projects"]) {
            const section = page.locator(`#${id}`);
            if (!(await section.count())) {
              test.info().annotations.push({ type: "missing-section", description: id });
              continue;
            }
            if (await menu.isVisible()) await menu.click();
            const link = page.locator(`header a[href="#${id}"]:visible`).first();
            await expect(link).toBeVisible();
            await link.click();
            await expect(section.locator("h2").first()).toBeInViewport();
            // Seeing the heading does not mean the paced section jump has finished.
            let previousScroll: number | undefined;
            let stationarySamples = 0;
            await expect
              .poll(async () => {
                const position = await page.evaluate(() => scrollY);
                stationarySamples = position === previousScroll ? stationarySamples + 1 : 0;
                previousScroll = position;
                return stationarySamples;
              })
              .toBeGreaterThanOrEqual(2);
            if (id === "experience" && width > height && reducedMotion === "no-preference") {
              const dots = section.locator("[data-timeline-dot]");
              if ((await dots.count()) > 1) {
                await expect(dots.first()).toHaveAttribute("data-timeline-filled");
                await expect(dots.nth(1)).not.toHaveAttribute("data-timeline-filled");
                await expect(section.locator("[data-compact]")).toHaveCount(0);
              }
            }
            if (id === "projects") {
              const previews = section.locator('button[aria-label^="View "]');
              if (await previews.count()) {
                // Stacked scenes intentionally cover older cards. Use a control a reader can hit.
                let label = "";
                await expect
                  .poll(async () => {
                    label = await previews.evaluateAll((nodes) => {
                      const button = nodes.find((node) => {
                        const box = node.getBoundingClientRect();
                        const x = box.left + box.width / 2;
                        const y = box.top + box.height / 2;
                        if (
                          box.width <= 0 ||
                          box.height <= 0 ||
                          box.left < 5 ||
                          box.right > innerWidth - 5 ||
                          box.top < 5 ||
                          box.bottom > innerHeight - 5
                        )
                          return false;
                        return [
                          [x, y],
                          [x, box.top + 5],
                          [x, box.bottom - 5],
                          [box.left + 5, y],
                          [box.right - 5, y],
                        ].every(([px, py]) => {
                          const hit = document.elementFromPoint(px, py);
                          return !!hit && (hit === node || node.contains(hit));
                        });
                      });
                      return button?.getAttribute("aria-label") ?? "";
                    });
                    return label;
                  })
                  .not.toBe("");
                const preview = section.getByRole("button", { name: label, exact: true });
                await preview.click();
                const dialog = page.getByRole("dialog");
                await expect(dialog).toBeVisible();
                await expect(dialog).toHaveAccessibleName(label.slice(5));
                await expect
                  .poll(() =>
                    dialog.evaluate((node) => {
                      const box = node.getBoundingClientRect();
                      return (
                        box.left >= -1 &&
                        box.right <= innerWidth + 1 &&
                        box.top >= -1 &&
                        box.bottom <= innerHeight + 1
                      );
                    }),
                  )
                  .toBe(true);
                await page.keyboard.press("Escape");
                await expect(dialog).toBeHidden();
              }
            }
          }
          if (width < height) {
            await expect(page.locator('#hero [class*="scene"]').first()).toHaveCSS(
              "position",
              "relative",
            );
          }
        });
      }
    }
  });
}

test("1280x600 desktop keeps the desktop layout without horizontal overflow", async ({ page }) => {
  await open(page, 1280, 600);
  expect(await page.evaluate(() => matchMedia("(pointer: fine)").matches)).toBe(true);
  await expect(page.locator("header ul a").first()).toBeVisible();
  for (const id of ["hero", "about", "skills", "experience", "projects", "contact"]) {
    const section = page.locator(`#${id}`);
    if (!(await section.count())) continue;
    await section.scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
  }
});
