import { expect, test } from "@playwright/test";

for (const [path, title, target] of [
  ["/privacy", "Your privacy matters", "retention"],
  ["/gdpr", "Your data rights", "response-time"],
]) {
  test(path + " keeps its notice readable, linked and keyboard accessible", async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.locator("article time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    await expect(page.locator('article a[href^="mailto:"]').first()).toHaveAttribute(
      "href",
      /^mailto:.+@.+/,
    );
    await expect(page.locator("main main")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#page-content")).toBeFocused();
    const contents = page.getByRole("navigation", {
      name: path === "/privacy" ? "Privacy page contents" : "GDPR page contents",
    });
    const disclosure = contents.locator("details");
    if (await disclosure.isVisible()) await disclosure.locator("summary").click();
    await contents.locator('a[href="#' + target + '"]:visible').click();
    await expect(page.locator("#" + target + " h2")).toBeVisible();
    const width = await page.evaluate(() => ({
      actual: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.actual).toBeLessThanOrEqual(width.viewport + 1);
    await page.screenshot({
      path: "test-results/legal-" + path.slice(1) + "-" + test.info().project.name + ".png",
    });
  });
}
