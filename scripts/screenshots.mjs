
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const url = "http://localhost:4000";

await mkdir("screenshots", { recursive: true });

const devices = [
  { name: "desktop", width: 1600, height: 900 },
  { name: "mobile", width: 390, height: 1100 },
];

try {
  for (const device of devices) {
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
        viewport: {
          width: device.width,
          height: device.height,
        },
        deviceScaleFactor: 1,
        colorScheme: theme,
        reducedMotion: "reduce",
      });

      try {
        // Set the theme before the app loads
        await page.addInitScript((selectedTheme) => {
          localStorage.setItem("theme", selectedTheme);
        }, theme);

        await page.goto(url, {
          waitUntil: "networkidle",
        });

        await page.evaluate(() => document.fonts.ready);

        // Hide the Next.js development overlay
        await page.addStyleTag({
          content: `
            nextjs-portal {
              display: none !important;
              visibility: hidden !important;
            }
          `,
        });

        // Wait for the page to settle
        await page.waitForTimeout(2000);

        // Check the header position
        const header = page.locator("header").first();

        if (await header.count()) {
          console.log(
            `${device.name} ${theme} header:`,
            await header.boundingBox()
          );
        }

        // Return to the top of the page
        await page.evaluate(() => {
          window.scrollTo({
            top: 0,
            behavior: "instant",
          });
        });

        await page.waitForTimeout(700);

        // Screenshot Hero
        await page.screenshot({
          path: `screenshots/${device.name}-${theme}-hero.png`,
          fullPage: false,
          animations: "disabled",
        });

        // Scroll so animated sections activate
        await page.evaluate(async () => {
          const delay = (ms) =>
            new Promise((resolve) => setTimeout(resolve, ms));

          const step = Math.round(window.innerHeight * 0.75);

          for (
            let position = 0;
            position < document.documentElement.scrollHeight;
            position += step
          ) {
            window.scrollTo(0, position);
            await delay(300);
          }

          window.scrollTo(0, 0);
          await delay(1500);
        });

        // Screenshot Full Page
        await page.screenshot({
          path: `screenshots/${device.name}-${theme}-full.png`,
          fullPage: true,
          animations: "disabled",
        });

        console.log(
          `✓ ${device.name} ${theme} screenshots generated`
        );
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log("All screenshots generated!");
