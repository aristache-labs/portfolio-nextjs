import { expect, test } from "./fixtures";

test("mobile hamburger opens the section list", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const hamburger = page.getByRole("button", { name: /open menu/i });
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  // Dropdown panel, not a dialog. Count stays unchecked: a hidden section is a
  // legitimate admin choice and would drop a link.
  await expect(page.getByTestId("mobile-section-link").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /close menu/i })).toBeVisible();
});
