import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    phase3Violations: string[];
  }
}

test.beforeEach(async ({ request }) => {
  const home = await request.get("/");
  const body = await home.text();
  expect(body).toContain("Adrian Cristache");
  expect(body).not.toContain("next-devtools");
});

test("security headers cover public, private, API and missing routes", async ({ request }) => {
  for (const path of [
    "/",
    "/privacy",
    "/gdpr",
    "/login",
    "/admin",
    "/api/auth/providers",
    "/__security-missing",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    const headers = response.headers();
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["content-security-policy"], path).toBeUndefined();
    expect(headers["content-security-policy-report-only"], path).toContain("connect-src 'self'");
    expect(headers["content-security-policy-report-only"], path).not.toContain("nonce-");
  }
  const admin = await request.get("/admin", { maxRedirects: 0 });
  const body = await admin.text();
  expect(
    ([307, 308].includes(admin.status()) && admin.headers().location?.endsWith("/login")) ||
      (admin.status() === 200 && body.includes("NEXT_REDIRECT") && body.includes("/login")),
  ).toBeTruthy();
  for (const privateKey of ["custom_blurb", "customBlurb", "github_cache", "AUTH_SECRET"]) {
    expect(body).not.toContain(privateKey);
  }
});

test("canonical, structured identity and discovery files agree", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Aristache.*Adrian Cristache/);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  // Next serializes a root canonical without a trailing slash when trailingSlash is false.
  const rootUrl = new URL("/", canonical!).toString();
  expect(new URL(canonical!).toString()).toBe(rootUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical!);
  const identity = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent!)));
  const person = identity.find((item) => item["@type"] === "Person");
  expect(person.name).toBe("Adrian Cristache");
  expect(person.alternateName).toEqual(["Cristache Adrian", "Aristache", "aristache-labs"]);
  expect(person.url).toBe(rootUrl);
  expect(person.image).toBe(new URL("/opengraph-image", canonical!).toString());
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>" + rootUrl + "</loc>");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).not.toContain("Host:");
  for (const group of robots.split(/\n\s*\n/).filter((group) => group.includes("User-Agent:"))) {
    expect(group).toContain("Disallow: /admin");
    expect(group).toContain("Disallow: /api");
  }
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("[GitHub](https://github.com/aristache-labs)");
  expect(llms).toContain("[LinkedIn](https://www.linkedin.com/in/adrian-cristache-727773444)");
  expect(llms).toContain("[Portfolio](" + rootUrl + ")");
  expect(llms).not.toContain(new URL(canonical!).origin + "//");
});

test("H1 retains the visible first name and exposes the rest to assistive technology", async ({
  page,
}) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  const firstName = h1.locator(":scope > span").first();
  const remainder = firstName.locator(".sr-only");
  await expect(remainder).toHaveCount(1);
  const rest = (await remainder.textContent())!.trim();
  await expect(h1).toHaveAccessibleName(new RegExp(rest));
  const box = await remainder.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(1);
  expect(box!.height).toBeLessThanOrEqual(1);
  const visible = await firstName.evaluate((node) => node.firstChild!.textContent!.trim());
  expect(visible).toBeTruthy();
  expect(await firstName.textContent()).toContain(visible);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#page-content")).toBeFocused();
});

test("Report-Only observes a disallowed source without blocking it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const state = window;
    state.phase3Violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      state.phase3Violations.push(event.effectiveDirective + ":" + event.disposition);
    });
  });
  await page.goto("/");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.phase3Violations)).toEqual([]);
  await page.route("https://csp-probe.invalid/pixel.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    }),
  );
  const probe = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) => {
      document.addEventListener("securitypolicyviolation", (event) => {
        if (event.blockedURI.includes("csp-probe.invalid")) resolve(event.disposition);
      });
    });
    const loaded = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = "https://csp-probe.invalid/pixel.svg";
    });
    return Promise.all([violation, loaded]);
  });
  expect(probe).toEqual(["report", true]);
  expect(errors).toEqual([]);
});

test("login can start OAuth without completing a sign-in", async ({ page }) => {
  await page.route("https://github.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>OAuth redirect intercepted</p>" }),
  );
  await page.goto("/login");
  const authorization = page.waitForRequest((request) =>
    request.url().startsWith("https://github.com/login/oauth/authorize"),
  );
  await page.getByRole("button", { name: "Login with GitHub" }).click();
  const url = new URL((await authorization).url());
  expect(url.searchParams.get("redirect_uri")).toContain("/api/auth/callback/github");
  await expect(page.getByText("OAuth redirect intercepted")).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("preserves the complete heading and static hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#hero video")).toHaveCount(0);
    const animations = await page
      .locator("#hero h1 span")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
    expect(animations.every((animation) => animation === "none")).toBeTruthy();
  });
});
