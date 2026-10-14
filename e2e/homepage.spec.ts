import { expect, test } from "@playwright/test";

test("homepage loads with correct title", async ({ page }) => {
  await page.goto("/");
  // Accept either "Adrian Cristache" or "Cristache Adrian" in the title
  await expect(page).toHaveTitle(/(Adrian.*Cristache|Cristache.*Adrian)/);
});

test("hero section h1 is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("key section anchors exist in the DOM", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#hero")).toBeAttached();
  await expect(page.locator("#projects")).toBeAttached();
  await expect(page.locator("#contact")).toBeAttached();
});