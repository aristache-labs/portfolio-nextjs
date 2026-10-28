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

test("footer preferences reflect consent and return keyboard focus", async ({ page }) => {
  await page.goto("/");
  await expect(panel(page)).toBeVisible();
  expect(await panel(page).evaluate((element) => element.contains(document.activeElement))).toBe(
    false,
  );
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("analytics-consent-v2"))).toBeNull();
  const accept = panel(page).getByRole("button", { name: "Accept", exact: true });
  const reject = panel(page).getByRole("button", { name: "Reject", exact: true });
  expect(await accept.getAttribute("class")).toBe(await reject.getAttribute("class"));
  await accept.click();
  const trigger = page.getByRole("button", { name: "Cookie settings", exact: true });
  await trigger.click();
  const checkbox = panel(page).getByRole("checkbox", { name: "Optional analytics", exact: true });
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.style.getPropertyValue("--consent-inset")),
  ).toBe("");
  const top = page.getByRole("button", { name: "Scroll to top", exact: true });
  await expect(top).toBeVisible();
  await expect
    .poll(() =>
      top.evaluate((element) => parseFloat(element.style.getPropertyValue("--consent-inset"))),
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await panel(page).getByRole("button", { name: "Save analytics preferences" }).click();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("analytics-consent-v2"))).toBe("accepted");
});

test("manual page views measure navigation and reacceptance exactly once", async ({
  page,
  analyticsTraffic,
}) => {
  test.setTimeout(90000);
  const views = () => analyticsTraffic.events.filter((event) => event.name === "page_view");
  await page.goto("/");
  const homeTitle = await page.title();
  await panel(page).getByRole("button", { name: "Accept", exact: true }).click();
  await expect.poll(() => views().length, { timeout: 25000 }).toBe(1);
  expect(new URL(views()[0].location!).pathname).toBe("/");
  expect(views()[0].title).toBe(homeTitle);
  await page.locator("footer").getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect.poll(() => views().length, { timeout: 25000 }).toBe(2);
  expect(new URL(views()[1].location!).pathname).toBe("/privacy");
  expect(views()[1].title).toBe(await page.title());
  const cookiesLink = page.locator('a[href="#cookies"]:visible');
  if ((await cookiesLink.count()) === 0) {
    await page.locator("summary").filter({ hasText: "On this page" }).click();
  }
  await cookiesLink.first().click();
  await page.waitForTimeout(8000);
  expect(views()).toHaveLength(2);
  await page.getByRole("button", { name: "Cookie settings", exact: true }).click();
  await panel(page).getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Cookie settings", exact: true }).click();
  await panel(page).getByRole("checkbox", { name: "Optional analytics", exact: true }).check();
  await panel(page).getByRole("button", { name: "Save analytics preferences" }).click();
  await expect.poll(() => views().length, { timeout: 25000 }).toBe(3);
  await page.waitForTimeout(8000);
  expect(views().map((event) => new URL(event.location!).pathname)).toEqual([
    "/",
    "/privacy",
    "/privacy",
  ]);
});

test("the initial consent banner does not prefetch Privacy", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.pathname === "/privacy" && url.searchParams.has("_rsc")) ||
      /app\/privacy\/page-[^/]+\.js$/.test(url.pathname)
    )
      requests.push(url.href);
  });
  await page.goto("/");
  await expect(panel(page)).toBeVisible();
  await page.waitForTimeout(1500);
  expect(requests).toEqual([]);
});

test("contact form interactions are excluded from analytics and do not send mail in tests", async ({
  page,
  analyticsTraffic,
}) => {
  test.setTimeout(60000);
  await page.route("**/api/contact", (route) => route.fulfill({ json: { ok: true } }));
  await page.goto("/");
  const form = page.locator("#contact form");
  test.skip((await form.count()) === 0, "The contact section is disabled in content settings");
  await panel(page).getByRole("button", { name: "Accept", exact: true }).click();
  await expect
    .poll(() => analyticsTraffic.events.some((event) => event.name === "page_view"), {
      timeout: 25000,
    })
    .toBe(true);
  await form.locator('[name="name"]').fill("Analytics Test");
  await form.locator('[name="email"]').fill("analytics@example.com");
  await form.locator('[name="subject"]').selectOption({ label: "General Question" });
  await form
    .locator('[name="message"]')
    .fill("Controlled analytics verification without sending a real contact message.");
  const response = page.waitForResponse((response) => response.url().endsWith("/api/contact"));
  await form.locator('button[type="submit"]').click();
  await response;
  await page.waitForTimeout(10000);
  expect(
    analyticsTraffic.events.filter((event) => ["form_start", "form_submit"].includes(event.name)),
  ).toEqual([]);
});
