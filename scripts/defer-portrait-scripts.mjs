import fs from "node:fs";
import path from "node:path";

const htmlPath = path.join(process.cwd(), ".next/server/app/index.html");
const gatePath = path.join(process.cwd(), "scripts/poster-script-gate.js");
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
