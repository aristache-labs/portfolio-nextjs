import fs from "node:fs";
import path from "node:path";

const htmlPath = path.join(process.cwd(), ".next/server/app/index.html");
const gatePath = path.join(process.cwd(), "scripts/poster-script-gate.js");

// On Vercel the home page has once come out of `next build` without this prerendered file, which
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

let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(
  /(<script\b[^>]*?)\ssrc="(\/_next\/static\/chunks\/[^"]+)"/g,
  '$1 data-poster-src="$2"',
);
html = html.replace(
  /(<link\b[^>]*\bas="script"[^>]*?)\shref="(\/_next\/static\/chunks\/[^"]+)"/g,
  '$1 data-poster-src="$2"',
);

if (!html.includes('id="poster-script-gate"')) {
  const gate = fs.readFileSync(gatePath, "utf8").trim();
  const marker = '<link rel="preload" as="script"';
  const tag = `<script id="poster-script-gate">${gate}</script>`;
  if (!html.includes(marker)) {
    console.error("script preload was not found");
    process.exit(1);
  }
  html = html.replace(marker, tag + marker);
}

const leftScripts = html.match(/<script\b[^>]*\ssrc="\/_next\/static\/chunks\//g);
const leftLinks = html.match(/<link\b[^>]*\bas="script"[^>]*\shref="\/_next\/static\/chunks\//g);
if (leftScripts || leftLinks) {
  console.error(
    "chunk urls still eager: scripts " +
      (leftScripts ? leftScripts.length : 0) +
      ", links " +
      (leftLinks ? leftLinks.length : 0),
  );
  process.exit(1);
}

fs.writeFileSync(htmlPath, html);
const held = html.match(/data-poster-src="\/_next\/static\/chunks\//g);
console.log("held chunk urls: " + (held ? held.length : 0));
