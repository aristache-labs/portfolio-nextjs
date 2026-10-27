import { defineConfig } from "@playwright/test";

// Run after bun run build. This config never starts the development server.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "seo-security.spec.ts",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
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
    command: "bun run start -- -p 4100",
    url: "http://localhost:4100",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
