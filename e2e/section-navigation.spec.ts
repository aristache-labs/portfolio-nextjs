import { expect, test } from "./fixtures";

test.describe("section navigation", () => {
  test.use({ reducedMotion: "reduce" });

  test("returns to Skills after manually scrolling up and reloading an old contact anchor", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get in Touch", exact: true }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await page.mouse.wheel(0, -100000);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await expect(page).toHaveURL(/\/#contact$/);
    await page.reload();
    await expect(page.locator('header a[aria-label="Home"]')).toHaveAttribute("href", "#hero");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await page.getByRole("link", { name: "Privacy", exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await page
      .getByRole("navigation", { name: "Explore", exact: true })
      .getByRole("link", { name: "Skills", exact: true })
      .click();
    await expect(page).toHaveURL(/\/#skills$/);
    await expect
      .poll(() =>
        page.locator("#skills").evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
      )
      .toBeLessThan(200);
  });

  test("clears the contact anchor at the top and returns from Privacy to Skills", async ({
    page,
  }) => {
    await page.goto("/");
    const contact = page.getByRole("link", { name: "Get in Touch", exact: true });
    const navigation = page.getByRole("navigation", { name: "Primary", exact: true });
    if (page.viewportSize()!.width < 1280) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await page.locator('[data-testid="mobile-section-link"][href="#contact"]').click();
    } else {
      await navigation.getByRole("link", { name: "Contact", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/#contact$/);
    await page.getByRole("button", { name: "Scroll to top", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await page.reload();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await contact.click();
    await expect(page).toHaveURL(/\/#contact$/);
    await page.getByRole("link", { name: "Privacy", exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await page
      .getByRole("navigation", { name: "Explore", exact: true })
      .getByRole("link", { name: "Skills", exact: true })
      .click();
    await expect(page).toHaveURL(/\/#skills$/);
    await expect
      .poll(() =>
        page.locator("#skills").evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
      )
      .toBeLessThan(200);
  });

  test("returns through the GDPR navigation after opening directly at Contact", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await expect(page.locator('header a[aria-label="Home"]')).toHaveAttribute("href", "#hero");
    await page.getByRole("link", { name: "GDPR", exact: true }).click();
    await expect(page).toHaveURL(/\/gdpr$/);
    if (page.viewportSize()!.width < 1280) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await page.locator('[data-testid="mobile-section-link"][href="/#skills"]').click();
    } else {
      await page
        .getByRole("navigation", { name: "Primary", exact: true })
        .getByRole("link", { name: "Skills", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/\/#skills$/);
  });
});
