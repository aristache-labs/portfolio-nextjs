import { expect, test } from "./fixtures";

test("keeps invalid Contact fields below the fixed header", async ({ page }, testInfo) => {
  // This short desktop viewport covers reflow geometry; real 200% zoom is checked separately.
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 768, height: 385 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let submissions = 0;
  await page.route("**/api/contact", async (route) => {
    submissions += 1;
    await route.abort();
  });
  await page.goto("/#contact");
  const name = page.getByRole("textbox", { name: "Your Name", exact: true });
  const email = page.getByRole("textbox", { name: "Your Email", exact: true });
  const message = page.getByRole("textbox", { name: "Message", exact: true });
  const send = page.getByRole("button", { name: "Send Message", exact: true });
  for (const invalid of [name, email, message]) {
    await name.fill(invalid === name ? "" : "Local audit");
    await email.fill(invalid === email ? "invalid-email" : "audit@example.com");
    await message.fill(invalid === message ? "" : "Validation only. Do not send.");
    await send.click();
    await expect(invalid).toBeFocused();
    await expect
      .poll(() =>
        invalid.evaluate((element) => {
          const field = element.getBoundingClientRect();
          const header = document.querySelector("header")!.getBoundingClientRect();
          return field.top >= header.bottom + 8 && field.bottom <= innerHeight - 8;
        }),
      )
      .toBe(true);
  }
  expect(submissions).toBe(0);
});
