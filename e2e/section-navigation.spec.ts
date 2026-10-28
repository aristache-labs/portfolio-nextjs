import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width}px section navigation`, () => {
    test.use({ viewport, reducedMotion: "reduce" });

    test("clears the contact anchor at the top and returns from Privacy to Skills", async ({
      page,
    }) => {
      await page.goto("/");
      const contact = page.getByRole("link", { name: "Get in Touch", exact: true });
      const navigation = page.getByRole("navigation", { name: "Primary", exact: true });
      if (viewport.width < 1280) {
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

    test("returns to Skills after opening the homepage directly at Contact", async ({ page }) => {
      await page.goto("/#contact");
      await expect(page.locator('header a[aria-label="Home"]')).toHaveAttribute("href", "#hero");
      await page.getByRole("link", { name: "Privacy", exact: true }).click();
      await expect(page).toHaveURL(/\/privacy$/);
      await page
        .getByRole("navigation", { name: "Explore", exact: true })
        .getByRole("link", { name: "Skills", exact: true })
        .click();
      await expect(page).toHaveURL(/\/#skills$/);
    });
  });
}
