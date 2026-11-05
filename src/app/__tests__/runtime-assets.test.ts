import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require("../../../next.config.js") as {
  outputFileTracingIncludes?: Record<string, string[]>;
};

it("ships the root layout's poster gate with every server route", () => {
  const gate = "./scripts/poster-script-gate.js";
  expect(config.outputFileTracingIncludes?.["/*"]).toContain(gate);
  expect(existsSync(resolve(gate))).toBe(true);
});
