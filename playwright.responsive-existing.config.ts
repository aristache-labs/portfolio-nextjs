import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// This verification must never start or restart the user's development server.
export default defineConfig({
  ...base,
  webServer: undefined,
  testMatch: "responsive-tablets.spec.ts",
  workers: 2,
  retries: 0,
  reporter: "line",
  projects: base.projects?.filter((project) =>
    ["chromium", "responsive-webkit"].includes(project.name ?? ""),
  ),
});
