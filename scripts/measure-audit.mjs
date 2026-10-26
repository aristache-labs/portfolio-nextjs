// Reproducible local production comparison. No network or CPU throttling is applied.
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://localhost:4100";
const browser = await chromium.launch();
const results = [];
try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1440, height: 900 } },
    { name: "portrait", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  ]) {
    for (let run = 1; run <= 3; run++) {
      const { name, ...options } = profile;
      const context = await browser.newContext({ ...options, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.auditLcp = null;
        new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1);
          window.auditLcp = {
            ms: entry.startTime,
            element: entry.element?.tagName,
            url: entry.url,
          };
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto(baseURL, { waitUntil: "load" });
      await page.waitForTimeout(5000);
      const metrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        return {
          lcp: window.auditLcp,
          bytes: resources.reduce((sum, resource) => sum + resource.encodedBodySize, 0),
          resources: resources.map(({ name, encodedBodySize, initiatorType }) => ({
            name,
            bytes: encodedBodySize,
            type: initiatorType,
          })),
        };
      });
      results.push({ profile: name, run, ...metrics });
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (process.env.AUDIT_OUTPUT) {
  await writeFile(process.env.AUDIT_OUTPUT, JSON.stringify(results, null, 2));
}
for (const name of ["desktop", "portrait"]) {
  const rows = results.filter((row) => row.profile === name);
  const median = (values) => values.sort((a, b) => a - b)[1];
  console.log(
    JSON.stringify({
      profile: name,
      medianLcpMs: median(rows.map((row) => row.lcp?.ms ?? 0)),
      medianResourceBytes: median(rows.map((row) => row.bytes)),
    }),
  );
}
