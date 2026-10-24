import { expect, test, type Page } from "@playwright/test";

async function interceptGoogleTags(page: Page) {
  const requests: string[] = [];
  await page.route("https://www.googletagmanager.com/**", (route) => {
    requests.push(route.request().url());
    // Exercise script loading without sending visitor data to Google.
    return route.fulfill({ contentType: "application/javascript", body: "" });
  });
  return requests;
}

test("Google tags stay blocked before consent and after rejection", async ({ page }) => {
  const requests = await interceptGoogleTags(page);
  await page.goto("/privacy");
  const preferences = page.getByRole("region", { name: "Analytics preferences", exact: true });
  await expect(preferences).toBeVisible();
  expect(requests).toEqual([]);

  await preferences.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(preferences).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  await expect(preferences).toBeHidden();
  expect(requests).toEqual([]);
});

test("Accept loads only gtag and withdrawing consent blocks it on reload", async ({ page }) => {
  const requests = await interceptGoogleTags(page);
  await page.goto("/privacy");
  const preferences = page.getByRole("region", { name: "Analytics preferences", exact: true });
  await preferences.getByRole("button", { name: "Accept", exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(new URL(requests[0]).pathname).toBe("/gtag/js");
  expect(new URL(requests[0]).searchParams.get("id")).toMatch(/^G-/);

  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await preferences.getByRole("checkbox", { name: "Optional analytics" }).uncheck();
  await preferences.getByRole("button", { name: "Save analytics preferences" }).click();
  await expect(preferences).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(
        (id) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`],
        new URL(requests[0]).searchParams.get("id"),
      ),
    )
    .toBe(true);

  requests.length = 0;
  await page.reload();
  await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  await expect(preferences).toBeHidden();
  expect(requests).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("does not load a Google Tag Manager fallback iframe", async ({ page }) => {
    const requests = await interceptGoogleTags(page);
    await page.goto("/privacy");
    await expect(page.locator('iframe[src*="googletagmanager.com"]')).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});
