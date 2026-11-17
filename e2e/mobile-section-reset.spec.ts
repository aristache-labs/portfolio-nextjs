import { expect, test, type Page } from "./fixtures";

async function navigate(page: Page, name: string, id: string) {
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.locator("header").getByRole("link", { name, exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  await expect
    .poll(() =>
      page.locator(`#${id}`).evaluate((node) => {
        const landing = node.querySelector<HTMLElement>("[data-scroll-landing]");
        if (landing)
          return Math.abs(
            landing.getBoundingClientRect().top - Number(landing.dataset.scrollLanding),
          );
        const anchor = node.querySelector("[data-scroll-anchor]");
        if (!anchor)
          return Math.abs(
            node.getBoundingClientRect().top -
              (Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0),
          );
        const height = document
          .querySelector('header nav[aria-label="Primary"]')!
          .getBoundingClientRect().height;
        // The landing gap differs per section and screen (see navigationGap in scroll-to-section),
        // so accept any gap that sits clearly under the bar and well within the first screen.
        const gap = anchor.getBoundingClientRect().top - height;
        return gap >= 4 && gap <= 120 ? 0 : Math.abs(gap);
      }),
    )
    .toBeLessThan(3);
}

/**
 * Sections notice a reader leaving through an IntersectionObserver, which reports after a rendered
 * frame. A person always spends frames scrolling; an instant jump back within the same frame would
 * not, so let two frames render before the next step.
 */
async function settleFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function wheelTo(page: Page, id: string) {
  const next = page.locator(`#${id}`);
  const distance = await next.evaluate((node) => node.getBoundingClientRect().top + 2);
  // Mobile WebKit has no mouse wheel; a native scrollBy is the same input for these checks.
  await page.evaluate((top) => scrollBy({ top, behavior: "instant" }), distance);
  await expect
    .poll(() => next.evaluate((node) => Math.abs(node.getBoundingClientRect().top + 2)))
    .toBeLessThan(8);
  await settleFrames(page);
}

async function wheelToBeginning(page: Page, id: string) {
  const heading = page.locator(`#${id} h2`).first();
  const distance = await heading.evaluate((node) => node.getBoundingClientRect().top - 110);
  // Mobile WebKit has no mouse wheel; a native scrollBy is the same input for these checks.
  await page.evaluate((top) => scrollBy({ top, behavior: "instant" }), distance);
  await expect
    .poll(() => heading.evaluate((node) => Math.abs(node.getBoundingClientRect().top - 110)))
    .toBeLessThan(8);
  await settleFrames(page);
}

for (const method of ["menu", "scroll"] as const) {
  test(`defers mobile resets until returning by ${method}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium", "Mobile-only reset behavior");
    test.setTimeout(90_000);
    // Cover paced menu transitions and returning through native scrolling.
    await page.emulateMedia({ reducedMotion: method === "menu" ? "no-preference" : "reduce" });
    await page.goto("/");
    const leave = async (name: string, id: string) => {
      if (method === "menu") await navigate(page, name, id);
      else await wheelTo(page, id);
    };
    const returnTo = async (name: string, id: string) => {
      if (method === "menu") await navigate(page, name, id);
      else await wheelToBeginning(page, id);
    };
    await navigate(page, "About", "about");
    const more = page.locator("#about").getByRole("button", { name: "Read more", exact: true });
    await more.scrollIntoViewIfNeeded();
    await more.press("Enter");
    await expect(
      page.locator("#about").getByRole("button", { name: "Show less", exact: true }),
    ).toBeVisible();
    await leave("Skills", "skills");
    await expect(
      page.locator("#about").getByRole("button", { name: "Show less", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await returnTo("About", "about");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await leave("Skills", "skills");

    await page.getByRole("tab", { name: "Development", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Development", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await leave("Experience", "experience");
    await expect(page.getByRole("tab", { name: "Development", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await returnTo("Skills", "skills");
    await expect(page.getByRole("tab", { name: "Most Used", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await leave("Experience", "experience");

    const details = page.locator("#experience details");
    await details.nth(0).locator("summary").click();
    await details.nth(1).locator("summary").click();
    await expect(page.locator("#experience details[open]")).toHaveCount(2);
    // Contact comes after Experience, so Experience stays above the reader and keeps its state.
    await leave("Contact", "contact");
    await expect(page.locator("#experience details[open]")).toHaveCount(2);
    await returnTo("Experience", "experience");
    await expect(page.locator("#experience details[open]")).toHaveCount(0);
    // Projects no longer paginates ("Show more projects" went with 5aaba00), so it has no state
    // to keep or reset.
  });
}

test("preserves desktop filters and expanded roles after navigating away", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop state must be preserved");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await navigate(page, "Skills", "skills");
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await navigate(page, "Experience", "experience");
  await expect(page.getByRole("tab", { name: "Development", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.locator("#experience details").first().locator("summary").click();
  await navigate(page, "Projects", "projects");
  await expect(page.locator("#experience details[open]")).toHaveCount(1);
});

test("keeps scroll and Experience stable after leaving a large Skills category", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "chromium", "Mobile layout stability");
  await page.goto("/");
  await navigate(page, "Skills", "skills");
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  const motion = page.evaluate(async () => {
    const samples: { top: number; backdrop: number; scroll: number; sourceHeight: number }[] = [];
    for (let frame = 0; frame < 240 && samples.length < 45; frame++) {
      await new Promise(requestAnimationFrame);
      const section = document.getElementById("experience")!;
      const anchor = section.querySelector("[data-scroll-anchor]")!;
      const header = document.querySelector('header nav[aria-label="Primary"]')!;
      const expected =
        header.getBoundingClientRect().height +
        (innerHeight <= 500 && innerWidth > innerHeight ? 14 : 38);
      const top = anchor.getBoundingClientRect().top;
      if (samples.length || Math.abs(top - expected) < 3)
        samples.push({
          top,
          backdrop: section.querySelector("img")!.getBoundingClientRect().top,
          scroll: scrollY,
          sourceHeight: document.getElementById("skills")!.getBoundingClientRect().height,
        });
    }
    return samples;
  });
  await navigate(page, "Experience", "experience");
  await expect(page.getByRole("tab", { name: "Development", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const samples = await motion;
  expect(samples).toHaveLength(45);
  expect(
    Math.max(...samples.map((sample) => sample.top)) -
      Math.min(...samples.map((sample) => sample.top)),
  ).toBeLessThan(4);
  expect(
    Math.max(...samples.map((sample) => sample.backdrop)) -
      Math.min(...samples.map((sample) => sample.backdrop)),
  ).toBeLessThan(4);
  expect(
    Math.max(...samples.map((sample) => sample.scroll)) -
      Math.min(...samples.map((sample) => sample.scroll)),
  ).toBeLessThan(4);
  expect(
    Math.max(...samples.map((sample) => sample.sourceHeight)) -
      Math.min(...samples.map((sample) => sample.sourceHeight)),
  ).toBeLessThan(4);
});
