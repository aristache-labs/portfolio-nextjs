import { expect, test, type Page } from "./fixtures";
import { SITE } from "../src/lib/seo/site";

function googleRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    const host = new URL(request.url()).hostname;
    if (/(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)$/.test(host))
      requests.push(request.url());
  });
  return requests;
}
const panel = (page: Page) => page.getByRole("region", { name: "Cookie preferences", exact: true });

test.beforeEach(async ({ request }) => {
  const response = await request.get("/");
  expect(await response.text()).toContain(SITE.name);
});

test("no Google traffic before consent, after rejection or after reload", async ({ page }) => {
  const requests = googleRequests(page);
  await page.goto("/");
  await expect(panel(page)).toBeVisible();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);
  await panel(page).getByRole("button", { name: "Reject", exact: true }).click();
  await expect(panel(page)).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Cookie settings" })).toBeAttached();
  await expect(panel(page)).toBeHidden();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);
});

test("real Google tag sets cookies only after Accept and withdrawal removes them", async ({
  page,
  context,
  analyticsTraffic,
}) => {
  const requests = googleRequests(page);
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to (load|connect)/i.test(message.text()))
      violations.push(message.text());
  });
  await page.goto("/privacy");
  await panel(page).getByRole("button", { name: "Accept", exact: true }).click();
  await expect
    .poll(() => requests.some((url) => new URL(url).pathname === "/gtag/js"), { timeout: 15000 })
    .toBe(true);
  await expect
    .poll(async () => (await context.cookies()).some(({ name }) => name === "_ga"), {
      timeout: 20000,
    })
    .toBe(true);
  await expect
    .poll(() => analyticsTraffic.events.some((event) => event.name === "page_view"), {
      timeout: 20000,
    })
    .toBe(true);
  await page.getByRole("button", { name: "Cookie settings" }).click();
  await panel(page).getByRole("button", { name: "Reject", exact: true }).click();
  await expect
    .poll(async () => (await context.cookies()).filter(({ name }) => name.startsWith("_ga")))
    .toEqual([]);
  await expect(panel(page)).toBeHidden();
  expect(violations).toEqual([]);
  requests.length = 0;
  await page.reload();
  await expect(page.getByRole("button", { name: "Cookie settings" })).toBeAttached();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);
});

for (const path of ["/admin", "/login"]) {
  test(`no banner or Google requests on ${path} even with saved acceptance`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("analytics-consent-v2", "accepted"));
    const requests = googleRequests(page);
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /login with GitHub/i })).toBeVisible();
    await expect(panel(page)).toBeHidden();
    await page.waitForTimeout(1000);
    expect(requests).toEqual([]);
  });
}

test("equal-size actions, unchecked preferences and fixed compact panel", async ({ page }) => {
  await page.goto("/");
  const preferences = panel(page);
  const accept = preferences.getByRole("button", { name: "Accept", exact: true });
  const reject = preferences.getByRole("button", { name: "Reject", exact: true });
  await expect(accept).toBeVisible();
  await expect(reject).toBeVisible();
  const acceptBox = (await accept.boundingBox())!;
  const rejectBox = (await reject.boundingBox())!;
  expect(acceptBox.width).toBe(rejectBox.width);
  expect(acceptBox.height).toBe(rejectBox.height);
  const viewport = page.viewportSize()!;
  // Desktop and phone landscape use compact 36px actions; portrait phones keep 44px targets.
  const landscape =
    viewport.width > viewport.height && viewport.width <= 1024 && viewport.height <= 500;
  expect(acceptBox.height).toBeGreaterThanOrEqual(landscape || viewport.width > 1024 ? 36 : 44);
  expect(await preferences.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
  await preferences.getByRole("button", { name: "Preferences", exact: true }).click();
  await expect(preferences.getByRole("checkbox", { name: "Optional analytics" })).not.toBeChecked();
});

test.describe("phone hero actions", () => {
  test.use({ isMobile: true, hasTouch: true });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 844, height: 390 },
  ]) {
    test(`hero actions remain accessible at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await expect(panel(page)).toBeVisible();
      const panelBox = (await panel(page).boundingBox())!;
      // Section visibility is content managed: inspect only the actions that exist.
      for (const link of await page.locator("#hero a:not([aria-label])").all()) {
        const box = await link.boundingBox();
        if (!box || box.width === 0 || box.height === 0) continue;
        expect(
          box.x < panelBox.x + panelBox.width &&
            box.x + box.width > panelBox.x &&
            box.y < panelBox.y + panelBox.height &&
            box.y + box.height > panelBox.y,
        ).toBe(false);
      }
    });
  }
});
