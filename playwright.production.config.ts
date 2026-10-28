import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Run after bun run build. This config never starts the development server.
export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "analytics-consent.spec.ts",
    "seo-security.spec.ts",
    "legal-pages.spec.ts",
    "section-navigation.spec.ts",
  ],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-production" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:4100",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "portrait",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: "landscape",
      use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "bun run start --port 4100",
    url: "http://localhost:4100",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
