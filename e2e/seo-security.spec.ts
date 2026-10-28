import { expect, test } from "./fixtures";

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
    expect(headers["strict-transport-security"], path).toBe("max-age=63072000; includeSubDomains");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["content-security-policy-report-only"], path).toBeUndefined();
    expect(headers["content-security-policy"], path).toContain("connect-src 'self'");
    expect(headers["content-security-policy"], path).not.toContain("nonce-");
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
  expect(person.givenName).toBe("Adrian");
  expect(person.familyName).toBe("Cristache");
  expect(person.alternateName).toEqual(["Cristache Adrian", "Aristache"]);
  expect(person.sameAs).toContain("https://github.com/aristache-labs");
  expect(person.url).toBe(rootUrl);
  expect(person.image).toBe(new URL("/opengraph-image", canonical!).toString());
  const website = identity.find((item) => item["@type"] === "WebSite");
  expect(website.alternateName).toEqual(["Aristache"]);
  expect(website.url).toBe(rootUrl);
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

test("CSP enforcement blocks disallowed images and connections", async ({ page }) => {
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
  let probeRequested = false;
  await page.route("https://csp-probe.invalid/**", (route) => {
    probeRequested = true;
    return route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    });
  });
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
  expect(probe).toEqual(["enforce", false]);
  const connected = await page.evaluate(async () => {
    try {
      await fetch("https://csp-probe.invalid/connect");
      return true;
    } catch {
      return false;
    }
  });
  expect(connected).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.phase3Violations))
    .toContain("connect-src:enforce");
  expect(probeRequested).toBe(false);
  expect(errors).toEqual([]);
});

test("allowed image hosts load under enforcement, including Blob previews and Shields badges", async ({
  page,
}) => {
  const urls = [
    "https://csp-fixture.public.blob.vercel-storage.com/preview.svg",
    "https://avatars.githubusercontent.com/csp-fixture.svg",
    "https://img.shields.io/github/stars/aristache-labs/csp-fixture.svg",
  ];
  for (const url of urls) {
    await page.route(url, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      }),
    );
  }
  await page.goto("/");
  const loaded = await page.evaluate(
    async (sources) =>
      Promise.all(
        sources.map(
          (src) =>
            new Promise<boolean>((resolve) => {
              const image = new Image();
              image.onload = () => resolve(true);
              image.onerror = () => resolve(false);
              image.src = src;
            }),
        ),
      ),
    urls,
  );
  expect(loaded).toEqual(urls.map(() => true));
});

test("external scripts are blocked before a network request", async ({ page }) => {
  let requested = false;
  await page.route("https://csp-probe.invalid/script.js", (route) => {
    requested = true;
    return route.fulfill({
      contentType: "application/javascript",
      body: "throw new Error('Unexpected script execution')",
    });
  });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) => {
      document.addEventListener("securitypolicyviolation", (event) => {
        if (event.blockedURI.includes("csp-probe.invalid")) resolve(event.disposition);
      });
    });
    const loaded = new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      script.src = "https://csp-probe.invalid/script.js";
      document.head.append(script);
    });
    return Promise.all([violation, loaded]);
  });
  expect(result).toEqual(["enforce", false]);
  expect(requested).toBe(false);
});

test("contact and upload requests reach their same-origin endpoints", async ({ page }) => {
  const seen = new Set<string>();
  await page.route("**/api/contact", (route) => {
    expect(route.request().postDataJSON().website).toBe("");
    seen.add("contact");
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/admin/upload", (route) => {
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data; boundary=");
    expect(route.request().postDataBuffer()!.toString()).toContain('name="folder"');
    seen.add("upload");
    return route.fulfill({
      status: 201,
      json: { url: "https://csp-fixture.public.blob.vercel-storage.com/preview.svg" },
    });
  });
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const contact = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "CSP Test",
        email: "csp@example.com",
        subject: "General Question",
        message: "Controlled CSP validation.",
        website: "",
      }),
    });
    const body = new FormData();
    body.append("folder", "projects");
    body.append(
      "file",
      new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "fixture.svg", {
        type: "image/svg+xml",
      }),
    );
    const upload = await fetch("/api/admin/upload", { method: "POST", body });
    return [contact.status, upload.status];
  });
  expect(results).toEqual([200, 201]);
  await expect.poll(() => [...seen].sort()).toEqual(["contact", "upload"]);
});

test("enforcement does not bypass the real upload authentication boundary", async ({ page }) => {
  await page.goto("/login");
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/admin/upload", { method: "POST", body: new FormData() });
    return { status: response.status, data: await response.json() };
  });
  expect(result).toEqual({ status: 401, data: { error: "Unauthorized" } });
});

test("public pages and any visible project gallery run without CSP violations", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.phase3Violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.phase3Violations.push(event.effectiveDirective + ":" + event.blockedURI);
    });
  });
  for (const path of ["/", "/privacy", "/gdpr", "/login"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    if (path === "/") {
      // Admin may hide any section. Never require a project or contact section in live data.
      const open = page
        .locator("#projects article")
        .getByRole("button", { name: /^View / })
        .first();
      if (await open.count()) {
        await open.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("button", { name: "Close", exact: true }).click();
      }
      const contact = page.locator("#contact");
      if (await contact.count()) await contact.scrollIntoViewIfNeeded();
    }
    const footer = page.locator("footer");
    if (await footer.count()) await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.phase3Violations), path).toEqual([]);
  }
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
