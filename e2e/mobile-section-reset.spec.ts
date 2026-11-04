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
        const portraitAbout = node.id === "about" && innerWidth <= 767 && innerHeight > innerWidth;
        const gap = portraitAbout ? 30 : innerHeight <= 500 && innerWidth > innerHeight ? 14 : 38;
        return Math.abs(anchor.getBoundingClientRect().top - height - gap);
      }),
    )
    .toBeLessThan(3);
}

async function wheelTo(page: Page, id: string) {
  const next = page.locator(`#${id}`);
  const distance = await next.evaluate((node) => node.getBoundingClientRect().top + 2);
  await page.mouse.wheel(0, distance);
  await expect
    .poll(() => next.evaluate((node) => Math.abs(node.getBoundingClientRect().top + 2)))
    .toBeLessThan(8);
}

async function wheelToBeginning(page: Page, id: string) {
  const heading = page.locator(`#${id} h2`).first();
  const distance = await heading.evaluate((node) => node.getBoundingClientRect().top - 110);
  await page.mouse.wheel(0, distance);
  await expect
    .poll(() => heading.evaluate((node) => Math.abs(node.getBoundingClientRect().top - 110)))
    .toBeLessThan(8);
}

for (const method of ["menu", "scroll"] as const) {
  test(`defers mobile resets until returning by ${method}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "Mobile-only reset behavior");
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
    const more = page.locator("#about").getByRole("button", { name: "View more", exact: true });
    await more.scrollIntoViewIfNeeded();
    await more.press("Enter");
    await expect(
      page.locator("#about").getByRole("button", { name: "View less", exact: true }),
    ).toBeVisible();
    await leave("Skills", "skills");
    await expect(
      page.locator("#about").getByRole("button", { name: "View less", exact: true }),
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
    await leave("Projects", "projects");
    await expect(page.locator("#experience details[open]")).toHaveCount(2);
    await returnTo("Experience", "experience");
    await expect(page.locator("#experience details[open]")).toHaveCount(0);
    await leave("Projects", "projects");

    const cards = page.locator("#projects article");
    const initialCount = await cards.count();
    const showMore = page.getByRole("button", { name: "Show more projects", exact: true });
    await showMore.click();
    await expect.poll(() => cards.count()).toBeGreaterThan(initialCount);
    // Opening a dialog must not reset the expanded grid or its opener.
    const opener = page.getByRole("button", { name: /^View / }).last();
    await opener.scrollIntoViewIfNeeded();
    await opener.press("Enter");
    await expect(page.getByRole("button", { name: "Close", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("button", { name: "Close", exact: true })).toBeHidden();
    await expect.poll(() => cards.count()).toBeGreaterThan(initialCount);
    await leave("Contact", "contact");
    await expect.poll(() => cards.count()).toBeGreaterThan(initialCount);
    await returnTo("Projects", "projects");
    await expect(cards).toHaveCount(initialCount);
    await expect(showMore).toBeAttached();
  });
}

test("preserves desktop filters and expanded roles after navigating away", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop state must be preserved");
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
  test.skip(testInfo.project.name === "desktop", "Mobile layout stability");
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
