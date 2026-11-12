import fs from "node:fs";
import path from "node:path";
import { deferPortraitHtml } from "./portrait-html.mjs";

const htmlPath = path.join(process.cwd(), ".next/server/app/index.html");
const gatePath = path.join(process.cwd(), "scripts/poster-script-gate.js");

// With a platform adapter (NEXT_ADAPTER_PATH, as on Vercel) scripts/portrait-adapter.mjs has
// already deferred the scripts of the prerendered home page, and the file below is not written.
if (process.env.NEXT_ADAPTER_PATH) {
  console.log("portrait scripts: handled by scripts/portrait-adapter.mjs");
  process.exit(0);
}

// On other platforms the home page has once come out of `next build` without this prerendered file, which
// failed the whole deploy. The page is still served, only without the deferred portrait scripts,
// so a missing file is a loud warning plus a description of what the build produced instead.
if (!fs.existsSync(htmlPath)) {
  const appDir = path.join(process.cwd(), ".next/server/app");
  const listing = fs.existsSync(appDir)
    ? fs.readdirSync(appDir).slice(0, 60).join(", ")
    : "(missing)";
  let route = "(no prerender manifest)";
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), ".next/prerender-manifest.json"), "utf8"),
    );
    route = JSON.stringify(manifest.routes?.["/"] ?? "(no entry for /)");
  } catch {}
  console.warn("WARNING: " + htmlPath + " is missing; portrait scripts are NOT deferred.");
  console.warn(
    "env: VERCEL=" + process.env.VERCEL + ", NEXT_ADAPTER_PATH=" + process.env.NEXT_ADAPTER_PATH,
  );
  console.warn(".next/server/app: " + listing);
  console.warn("prerender-manifest routes['/']: " + route);
  // Next 16.4 runs Vercel's `onBuildComplete` adapter inside `next build`, which has already moved
  // the output into .vercel/output by the time this script starts. List where the home page is.
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 6 || found.length > 40 || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (/^index.*\.(html|json)$/.test(entry.name) || /prerender-fallback/.test(entry.name))
        found.push(path.relative(process.cwd(), full) + " (" + fs.statSync(full).size + "B)");
    }
  };
  walk(path.join(process.cwd(), ".vercel/output"), 0);
  console.warn(".vercel/output index/prerender files: " + (found.join(", ") || "(none)"));
  process.exit(0);
}

const gate = fs.readFileSync(gatePath, "utf8");
let result;
try {
  result = deferPortraitHtml(fs.readFileSync(htmlPath, "utf8"), gate);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
fs.writeFileSync(htmlPath, result.html);
console.log("held chunk urls: " + result.held);
