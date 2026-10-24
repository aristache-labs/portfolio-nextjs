import { expect, test, type Page } from "@playwright/test";

async function interceptAnalytics(page: Page) {
  const requests: string[] = [];
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route(
    /https:\/\/[^/]*(featureassets\.org|prodregistryv2\.org|statsigapi\.net|statsigcdn\.com|statsig\.com)\//,
    (route) => {
      requests.push(route.request().url());
      return route.fulfill({
        json: {
          has_updates: true,
          feature_gates: {},
          dynamic_configs: {},
          layer_configs: {},
          time: Date.now(),
        },
      });
    },
  );
  return requests;
}

async function statsigStorage(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).filter((key) => key.startsWith("statsig.")),
    session: Object.keys(sessionStorage).filter((key) => key.startsWith("statsig.")),
  }));
}

async function stableID(page: Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) => key.startsWith("statsig.stable_id."));
    return key ? localStorage.getItem(key) : null;
  });
}

test("Statsig makes no requests or identifiers before consent or after rejection", async ({
  page,
}) => {
  const requests = await interceptAnalytics(page);
  await page.goto("/privacy");
  const preferences = page.getByRole("region", { name: "Analytics preferences", exact: true });
  await expect(preferences).toBeVisible();
  expect(requests).toEqual([]);
  expect(await statsigStorage(page)).toEqual({ local: [], session: [] });
  await preferences.getByRole("button", { name: "Reject", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  expect(await statsigStorage(page)).toEqual({ local: [], session: [] });
});

test("consented visitors receive distinct stable IDs and withdrawal removes storage", async ({
  page,
  browser,
}) => {
  const requests = await interceptAnalytics(page);
  await page.goto("/privacy");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect.poll(() => stableID(page)).not.toBeNull();
  const firstID = await stableID(page);
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page.reload();
  await expect.poll(() => stableID(page)).toBe(firstID);

  const other = await browser.newContext();
  try {
    const secondPage = await other.newPage();
    await interceptAnalytics(secondPage);
    await secondPage.goto("http://localhost:4000/privacy");
    await secondPage.getByRole("button", { name: "Accept", exact: true }).click();
    await expect.poll(() => stableID(secondPage)).not.toBeNull();
    expect(await stableID(secondPage)).not.toBe(firstID);
  } finally {
    await other.close();
  }

  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await page.getByRole("checkbox", { name: "Optional analytics" }).uncheck();
  await page.getByRole("button", { name: "Save analytics preferences" }).click();
  await expect.poll(() => statsigStorage(page)).toEqual({ local: [], session: [] });
  requests.length = 0;
  await page.reload();
  await expect(page.getByRole("button", { name: "Analytics", exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  expect(await statsigStorage(page)).toEqual({ local: [], session: [] });
});
